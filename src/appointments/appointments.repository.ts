import { Inject } from '@nestjs/common';
import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { DataSource, QueryFailedError } from 'typeorm';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import {
  Appointment,
  AppointmentStatus,
} from 'src/@common/entities/appointment.entity';

export interface FindAppointmentsFilters {
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export abstract class AppointmentsRepository {
  abstract create(data: Partial<Appointment>): Promise<Appointment>;

  abstract findById(id: number): Promise<Appointment | null>;

  abstract hasPatientConflict(
    patientId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean>;

  abstract hasConflict(
    doctorId: number,
    patientId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean>;

  abstract find(filters: FindAppointmentsFilters): Promise<Appointment[]>;

  abstract update(
    id: number,
    appointment: Partial<Appointment>,
  ): Promise<Appointment>;
}
export const APPOINTMENTS_TYPEORM_REPOSITORY = 'APPOINTMENTS_REPOSITORY';

export class AppointmentsTypeORMRepository implements AppointmentsRepository {
  constructor(
    @Inject(DATASOURCE_TOKEN)
    private readonly dataSource: DataSource,
  ) {}

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
      };
      if (
        driverError.code === '23P01' &&
        driverError.constraint === 'EXCL_APPOINTMENT_PATIENT_OVERLAP'
      ) {
        throw new DomainError(
          'Já existe um agendamento para este paciente dentro do horário solicitado.',
          ERROR_CODE.PACIENTE_INDISPONIVEL,
        );
      }

      if (
        driverError.code === '23P01' &&
        driverError.constraint === 'EXCL_APPOINTMENT_DOCTOR_OVERLAP'
      ) {
        throw new DomainError(
          'O horário solicitado para esse médico não está disponível.',
          ERROR_CODE.HORARIO_INDISPONIVEL,
        );
      }
    }

    //Expandir classes de erro para tratar outros tipos de erros do banco de dados, como violação de chave estrangeira, etc.
    throw error;
  }

  async create(appointmentData: Partial<Appointment>): Promise<Appointment> {
    try {
      const repository = this.dataSource.getRepository(Appointment);

      const appointment = repository.create(appointmentData);

      return await repository.save(appointment);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findById(id: number): Promise<Appointment | null> {
    try {
      return await this.dataSource.getRepository(Appointment).findOne({
        where: { id },
        relations: {
          doctor: true,
          patient: true,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async find(filters: FindAppointmentsFilters): Promise<Appointment[]> {
    try {
      const queryBuilder = this.dataSource
        .getRepository(Appointment)
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.doctor', 'doctor')
        .leftJoinAndSelect('appointment.patient', 'patient');

      if (filters.doctorId !== undefined) {
        queryBuilder.andWhere('appointment.doctorId = :doctorId', {
          doctorId: filters.doctorId,
        });
      }

      if (filters.patientId !== undefined) {
        queryBuilder.andWhere('appointment.patientId = :patientId', {
          patientId: filters.patientId,
        });
      }

      if (filters.status !== undefined) {
        queryBuilder.andWhere('appointment.status = :status', {
          status: filters.status,
        });
      }

      if (filters.from) {
        queryBuilder.andWhere('appointment.startsAt >= :from', {
          from: filters.from,
        });
      }

      if (filters.to) {
        queryBuilder.andWhere('appointment.startsAt < :to', {
          to: filters.to,
        });
      }

      return queryBuilder
        .orderBy('appointment.startsAt', 'ASC')
        .skip((filters.page - 1) * filters.pageSize)
        .take(filters.pageSize)
        .getMany();
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async hasPatientConflict(
    patientId: number,
    startAt: Date,
    endsAt: Date,
  ): Promise<boolean> {
    try {
      const conflictCount = await this.dataSource
        .getRepository(Appointment)
        .createQueryBuilder('appointment')
        .where('appointment.startsAt < :endsAt', { endsAt: endsAt })
        .andWhere('appointment.endsAt > :startsAt', { startsAt: startAt })
        .andWhere('appointment.status != :cancelled', {
          cancelled: 'cancelled',
        })
        .andWhere('appointment.deletedAt IS NULL')
        .andWhere('appointment.patientId = :patientId', { patientId })
        .getCount();

      return conflictCount > 0;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(
    id: number,
    appointment: Partial<Appointment>,
  ): Promise<Appointment> {
    try {
      const repository = this.dataSource.getRepository(Appointment);

      await repository.update({ id: id }, appointment);

      return await repository.findOneByOrFail({
        id: id,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  //O método abaixo ficou em desuso ao utilizar constraints no próprio banco para valiPar horáriod a consulta
  async hasConflict(
    doctorId: number,
    patientId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean> {
    const conflictCount = await this.dataSource
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .where('appointment.startsAt < :endsAt', { endAt })
      .andWhere('appointment.endsAt > :startsAt', { startAt })
      .andWhere('appointment.status != :cancelled', {
        cancelled: 'cancelled',
      })
      .andWhere('appointment.deletedAt IS NULL')
      .andWhere(
        '(appointment.doctorId = :doctorId OR appointment.patientId = :patientId)',
        { doctorId, patientId },
      )
      .getCount();

    return conflictCount > 0;
  }
}
