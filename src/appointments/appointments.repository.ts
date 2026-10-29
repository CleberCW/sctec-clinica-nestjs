import { Inject } from '@nestjs/common';
import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { DataSource } from 'typeorm';
import { Appointment } from './entities/appointment.entity';

export abstract class AppointmentsRepository {
  abstract create(data: Partial<Appointment>): Promise<Appointment>;

  abstract findById(id: number): Promise<Appointment | null>;

  abstract hasConflict(
    doctorId: number,
    patientId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean>;
}
export const APPOINTMENTS_TYPEORM_REPOSITORY = 'APPOINTMENTS_REPOSITORY';

export class AppointmentsTypeORMRepository implements AppointmentsRepository {
  constructor(
    @Inject(DATASOURCE_TOKEN)
    private readonly dataSource: DataSource,
  ) {}

  async create(appointmentData: Partial<Appointment>): Promise<Appointment> {
    const repository = this.dataSource.getRepository(Appointment);

    const appointment = repository.create(appointmentData);

    return repository.save(appointment);
  }

  async findById(id: number): Promise<Appointment | null> {
    return this.dataSource.getRepository(Appointment).findOne({
      where: { id },
      relations: ['doctor', 'patient'],
    });
  }

  async hasConflict(
    doctorId: number,
    patientId: number,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean> {
    const conflictCount = await this.dataSource
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .where('appointment.startAt < :endAt', { endAt })
      .andWhere('appointment.endAt > :startAt', { startAt })
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
