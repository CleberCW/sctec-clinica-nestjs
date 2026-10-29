import { Injectable } from '@nestjs/common';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { toAbsoluteDayMinutes } from 'src/@common/utils/utils';
import { DoctorsService } from 'src/doctors/doctors.service';
import { PatientsService } from 'src/patients/patients.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly doctorsService: DoctorsService,
    private readonly patientsService: PatientsService,
  ) {}

  private async validateAppointmentTime(
    startAt: Date,
    doctorId: number,
    patientId: number,
  ): Promise<Date> {
    if (Number.isNaN(startAt.getTime())) {
      throw new DomainError(
        'Data e hora inválidas.',
        ERROR_CODE.DADOS_INVALIDOS,
      );
    }

    const weekDay = startAt.getUTCDay();

    const doctorSchedule = await this.doctorsService.getSchedule(doctorId);

    const appointmentMinutes =
      startAt.getUTCHours() * 60 + startAt.getUTCMinutes();

    for (const schedule of doctorSchedule.shifts) {
      if (schedule.weekDay !== weekDay) {
        continue;
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
        startAt.getTime() + schedule.slotDurationMinutes * 60_000,
      );

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

      return endAt;
    }

    throw new DomainError(
      'O horário do agendamento está fora da escala do médico.',
      ERROR_CODE.HORARIO_FORA_DA_ESCALA,
    );
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const doctor = await this.doctorsService.getOne(dto.doctorId);

    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const patient = await this.patientsService.getOne(dto.patientId);

    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const startAt = new Date(dto.startAt);

    const endAt = await this.validateAppointmentTime(
      startAt,
      dto.doctorId,
      dto.patientId,
    );

    return this.appointmentsRepository.create({
      doctorId: doctor.id,
      patientId: patient.id,
      startAt,
      endAt,
      notes: dto.notes ?? null,
    });
  }
}
