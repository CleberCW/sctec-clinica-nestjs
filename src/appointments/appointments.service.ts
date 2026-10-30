import { Injectable } from '@nestjs/common';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { toAbsoluteDayMinutes } from 'src/@common/utils/utils';
import { DoctorsService } from 'src/doctors/doctors.service';
import { PatientsService } from 'src/patients/patients.service';
import { Appointment } from 'src/@common/entities/appointment.entity';
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

    const weekDay = startAt.getUTCDay();

    const appointmentMinutes =
      startAt.getUTCHours() * 60 + startAt.getUTCMinutes();

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

      if (appointmentMinutes % schedule.slotDurationMinutes !== 0) {
        throw new DomainError(
          'O horário do agendamento não coincide com a duração dos slots do médico.',
          ERROR_CODE.HORARIO_FORA_DA_ESCALA,
        );
      }

      const scheduleStartMinutes = toAbsoluteDayMinutes(schedule.startTime);

      const scheduleEndMinutes = toAbsoluteDayMinutes(schedule.endTime);

      const appointmentEndMinutes =
        appointmentMinutes + schedule.slotDurationMinutes;

      if (
        appointmentMinutes < scheduleStartMinutes ||
        appointmentEndMinutes > scheduleEndMinutes
      ) {
        continue;
      }

      const endAt = new Date(
        startAt.getTime() + schedule.slotDurationMinutes * 60000,
      );

      return endAt;
    }

    throw new DomainError(
      'O horário do agendamento está fora da escala do médico.',
      ERROR_CODE.HORARIO_FORA_DA_ESCALA,
    );
  }

  private async checkForConflicts(
    doctorId: number,
    patientId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<void> {
    const hasConflict = await this.appointmentsRepository.hasConflict(
      doctorId,
      patientId,
      startAt,
      endAt,
    );

    if (hasConflict) {
      throw new DomainError(
        'O horário solicitado não está disponível.',
        ERROR_CODE.HORARIO_INDISPONIVEL,
      );
    }
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const patient = await this.patientsService.getOne(dto.patientId);

    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const doctor = await this.doctorsService.getOne(dto.doctorId, {
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
      const doctor = await this.doctorsService.getOne(Number(user.sub), {
        schedules: false,
      });

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
}
