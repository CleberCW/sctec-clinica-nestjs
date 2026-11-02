import { Injectable } from '@nestjs/common';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { toAbsoluteDayMinutes } from 'src/@common/utils/utils';
import { DoctorsService } from 'src/doctors/doctors.service';
import { PatientsService } from 'src/patients/patients.service';
import {
  Appointment,
  APPOINTMENT_STATUSES,
} from 'src/@common/entities/appointment.entity';
import { DoctorSchedule } from 'src/@common/entities/doctorSchedule.entity';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { ROLES } from 'src/@common/entities/role.entity';
import { AuthUserDto } from 'src/users/dto/auth-user.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly doctorsService: DoctorsService,
    private readonly patientsService: PatientsService,
  ) {}

  private validateAppointmentSchedule(
    startAt: Date,
    doctorSchedules: DoctorSchedule[],
  ): Date {
    if (Number.isNaN(startAt.getTime())) {
      throw new DomainError(
        'Data e hora inválidas.',
        ERROR_CODE.DADOS_INVALIDOS,
      );
    }

    if (startAt.getTime() < Date.now()) {
      throw new DomainError(
        'A data e hora do agendamento não podem ser no passado.',
        ERROR_CODE.DADOS_INVALIDOS,
      );
    }

    const localParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(startAt);

    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      localParts.find((part) => part.type === type)?.value;

    const weekdays: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const weekDay = weekdays[getPart('weekday') ?? ''];

    const appointmentMinutes =
      Number(getPart('hour')) * 60 + Number(getPart('minute'));

    if (!doctorSchedules || doctorSchedules.length === 0) {
      throw new DomainError(
        'O médico não possui horários de atendimento cadastrados.',
        ERROR_CODE.HORARIO_FORA_DA_ESCALA,
      );
    }

    for (const schedule of doctorSchedules) {
      if (schedule.weekDay !== weekDay) {
        continue;
      }

      const scheduleStartMinutes = toAbsoluteDayMinutes(schedule.startTime);

      const scheduleEndMinutes = toAbsoluteDayMinutes(schedule.endTime);

      const appointmentEndMinutes =
        appointmentMinutes + schedule.slotDurationMinutes;

      // Verifica se o atendimento cabe integralmente no turno.
      if (
        appointmentMinutes < scheduleStartMinutes ||
        appointmentEndMinutes > scheduleEndMinutes
      ) {
        continue;
      }

      // Alinha os slots a partir do início do turno.
      if (
        (appointmentMinutes - scheduleStartMinutes) %
          schedule.slotDurationMinutes !==
        0
      ) {
        continue;
      }

      return new Date(startAt.getTime() + schedule.slotDurationMinutes * 60000);
    }

    throw new DomainError(
      'O horário do agendamento está fora da escala do médico.',
      ERROR_CODE.HORARIO_FORA_DA_ESCALA,
    );
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const patient = await this.patientsService.getOne(dto.patientId);

    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const doctor = await this.doctorsService.getOne({
      id: dto.doctorId,
      schedules: true,
    });

    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const startsAt = new Date(dto.startsAt);

    const endsAt = this.validateAppointmentSchedule(startsAt, doctor.schedules);

    // Aqui não seria necessário devido à existência de constraint do banco, mas a atividade pede que seja verificado
    // primeiro o paciente, depois o médico. Como não é possível garantir a ordem das verificações no banco,
    // optei por checar se conflita o paciente, e o banco se encarregará do conflito do médico
    if (
      await this.appointmentsRepository.hasPatientConflict(
        patient.id,
        startsAt,
        endsAt,
      )
    ) {
      throw new DomainError(
        'Já existe um agendamento para este paciente dentro do horário solicitado.',
        ERROR_CODE.PACIENTE_INDISPONIVEL,
      );
    }

    return this.appointmentsRepository.create({
      doctorId: doctor.id,
      patientId: patient.id,
      startsAt,
      endsAt,
      notes: dto.notes ?? null,
      status: 'scheduled',
    });
  }

  async getAll(
    query: FindAppointmentsDto,
    user: AuthUserDto,
  ): Promise<Appointment[]> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    let doctorId = query.doctorId;

    const isDoctor = user.data.roles.includes(ROLES.DOCTOR);
    const isAdmin = user.data.roles.includes(ROLES.ADMIN);

    if (isDoctor && !isAdmin) {
      const doctor = await this.doctorsService.getOne({
        schedules: false,
        userId: Number(user.sub),
      });

      if (!doctor) {
        throw new DomainError(
          'Você não tem permissão para acessar esse recurso',
          ERROR_CODE.ACESSO_NEGADO,
        );
      }

      doctorId = doctor.id;
    }

    const filters = {
      doctorId,
      patientId: query.patientId,
      status: query.status,
      from: query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined,
      to: query.to ? new Date(`${query.to}T00:00:00.000Z`) : undefined,
      page,
      pageSize,
    };

    return this.appointmentsRepository.find(filters);
  }

  async getById(id: number, user: AuthUserDto): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new DomainError(
        'Agendamento não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const isDoctor = user.data.roles.includes(ROLES.DOCTOR);
    const isAdmin = user.data.roles.includes(ROLES.ADMIN);

    if (isDoctor && !isAdmin) {
      const doctor = await this.doctorsService.getOne({
        userId: Number(user.sub),
        schedules: false,
      });

      if (appointment.doctorId !== doctor.id) {
        throw new DomainError(
          'Você não tem permissão para acessar este agendamento.',
          ERROR_CODE.ACESSO_NEGADO,
        );
      }
    }

    return appointment;
  }

  async update(
    id: number,
    dto: Partial<CreateAppointmentDto> & { status?: Appointment['status'] },
    user: AuthUserDto,
  ): Promise<Appointment> {
    const appointment = await this.getById(id, user);

    if (!appointment) {
      throw new DomainError(
        'Agendamento não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    if (
      !dto.status ||
      !Object.values(APPOINTMENT_STATUSES).includes(dto.status)
    ) {
      throw new DomainError(
        'O novo status é inválido.',
        ERROR_CODE.DADOS_INVALIDOS,
      );
    }

    const isAdmin = user.data.roles.includes(ROLES.ADMIN);
    const isDoctor = user.data.roles.includes(ROLES.DOCTOR);
    const isSecretary = user.data.roles.includes(ROLES.SECRETARY);

    // getById já validou o vínculo entre o médico e o agendamento.
    const isCorrectDoctor = isDoctor && !isAdmin;

    if (appointment.status === 'scheduled') {
      if (dto.status == 'in_progress') {
        if (!isCorrectDoctor && !isAdmin) {
          throw new DomainError(
            'Você não tem permissão para alterar o status do agendamento para "em andamento".',
            ERROR_CODE.ACESSO_NEGADO,
          );
        }

        return await this.appointmentsRepository.update(id, {
          status: 'in_progress',
        });
      }
      if (dto.status == 'cancelled') {
        if (!isSecretary && !isAdmin && !isCorrectDoctor) {
          throw new DomainError(
            'Você não tem permissão para cancelar este agendamento.',
            ERROR_CODE.ACESSO_NEGADO,
          );
        }

        return await this.appointmentsRepository.update(id, {
          status: 'cancelled',
        });
      }
    }

    if (appointment.status === 'in_progress') {
      if (dto.status == 'done' || dto.status == 'cancelled') {
        if (!isCorrectDoctor && !isAdmin) {
          throw new DomainError(
            'Você não tem permissão para alterar o status do agendamento para "concluído".',
            ERROR_CODE.ACESSO_NEGADO,
          );
        }

        return this.appointmentsRepository.update(id, {
          status: dto.status,
        });
      }
    }

    throw new DomainError(
      'A transição de status solicitada não é permitida.',
      ERROR_CODE.TRANSICAO_INVALIDA,
    );
  }
}
