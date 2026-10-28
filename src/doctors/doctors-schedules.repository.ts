import { DoctorSchedule } from 'src/@common/entities/doctorSchedule.entity';
import { CreateDoctorSchedulesDto } from './dto/create-doctor-schedule.dto';
import { Injectable, Inject } from '@nestjs/common';
import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { DataSource } from 'typeorm';

export abstract class DoctorSchedulesRepository {
  abstract replaceSchedules(
    doctorId: number,
    dto: CreateDoctorSchedulesDto,
  ): Promise<DoctorSchedule[]>;

  abstract findByDoctor(doctorId: number): Promise<DoctorSchedule[]>;
}

@Injectable()
export class DoctorSchedulesTypeORMRepository implements DoctorSchedulesRepository {
  constructor(
    @Inject(DATASOURCE_TOKEN)
    private readonly dataSource: DataSource,
  ) {}

  async replaceSchedules(
    doctorId: number,
    dto: CreateDoctorSchedulesDto,
  ): Promise<DoctorSchedule[]> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(DoctorSchedule);

      await repository.delete({ doctorId });

      const entities = dto.shifts.map((shift) =>
        repository.create({
          ...shift,
          doctorId,
        }),
      );

      return repository.save(entities);
    });
  }

  async findByDoctor(doctorId: number): Promise<DoctorSchedule[]> {
    return this.dataSource.getRepository(DoctorSchedule).find({
      where: { doctorId },
    });
  }
}
