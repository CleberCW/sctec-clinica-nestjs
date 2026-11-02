import { Injectable } from '@nestjs/common';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { AuthUserDto } from 'src/users/dto/auth-user.dto';
import { ROLES } from 'src/@common/entities/role.entity';
import { MedicalRecordsRepository } from './medical-records.repository';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import { APPOINTMENT_STATUSES } from 'src/@common/entities/appointment.entity';
import { DoctorsService } from 'src/doctors/doctors.service';
import { PatientsService } from './patients.service';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly medicalRecordsRepository: MedicalRecordsRepository,
    private readonly doctorService: DoctorsService,
    private readonly patientService: PatientsService,
  ) {}

  async createMedicalRecord(
    patientId: number,
    createMedicalRecordDto: CreateMedicalRecordDto,
    user: AuthUserDto,
  ) {
    if (!user.sub || isNaN(Number(user.sub))) {
      throw new DomainError(
        'O ID do usuário não é válido no token de autenticação.',
        ERROR_CODE.DADOS_INVALIDOS,
      );
    }

    if (Number.isNaN(patientId)) {
      throw new DomainError(
        'O ID do paciente fornecido é inválido.',
        ERROR_CODE.DADOS_INVALIDOS,
      );
    }

    const patient = await this.patientService.getOne(patientId);

    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const doctor = await this.doctorService.getOne({
      userId: Number(user.sub),
    });

    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const filteredAppointments = patient.appointments.filter(
      (appt) =>
        (appt.status === APPOINTMENT_STATUSES.DONE ||
          appt.status === APPOINTMENT_STATUSES.IN_PROGRESS) &&
        appt.doctorId === doctor.id,
    );

    if (filteredAppointments.length === 0) {
      throw new DomainError(
        'O médico não tem consulta com vínculo para criar um registro médico para este paciente.',
        ERROR_CODE.ACESSO_NEGADO,
      );
    }

    const appointmentId =
      createMedicalRecordDto.appointmentId ??
      filteredAppointments.reduce((max, appt) => Math.max(max, appt.id), 0);

    return this.medicalRecordsRepository.createMedicalRecord({
      patientId: patientId,
      doctorId: doctor.id,
      appointmentId,
      text: createMedicalRecordDto.text,
    });
  }

  async getMedicalRecordsByPatientId(patientId: number, user: AuthUserDto) {
    if (Number.isNaN(patientId)) {
      throw new DomainError(
        'O ID do paciente fornecido é inválido.',
        ERROR_CODE.DADOS_INVALIDOS,
      );
    }

    if (!user.sub) {
      throw new DomainError(
        'O ID do usuário não está disponível no token de autenticação.',
        ERROR_CODE.DADOS_INVALIDOS,
      );
    }

    const isDoctor = user.data.roles.includes(ROLES.DOCTOR);
    const isAdmin = user.data.roles.includes(ROLES.ADMIN);

    if (!isDoctor && !isAdmin) {
      throw new DomainError('Acesso negado', ERROR_CODE.ACESSO_NEGADO);
    }

    const patient = await this.patientService.getOne(patientId);

    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    if (isAdmin) {
      return await this.medicalRecordsRepository.getMedicalRecordsByPatient(
        patientId,
      );
    }

    if (isDoctor) {
      const doctor = await this.doctorService.getOne({
        userId: Number(user.sub),
      });

      if (!doctor) {
        throw new DomainError(
          'O médico autenticado não foi encontrado.',
          ERROR_CODE.DADOS_INVALIDOS,
        );
      }

      const filteredAppointments = patient.appointments.filter(
        (appt) =>
          (appt.status === APPOINTMENT_STATUSES.DONE ||
            appt.status === APPOINTMENT_STATUSES.IN_PROGRESS) &&
          appt.doctorId === doctor.id,
      );

      if (filteredAppointments.length === 0) {
        throw new DomainError(
          'O médico não tem consulta com vínculo para ler um registro médico para este paciente.',
          ERROR_CODE.ACESSO_NEGADO,
        );
      }

      return await this.medicalRecordsRepository.getMedicalRecordsByPatient(
        patientId,
        doctor.id,
      );
    }

    throw new DomainError('Acesso negado', ERROR_CODE.ACESSO_NEGADO);
  }
}
