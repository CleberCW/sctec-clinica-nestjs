import { DataSource, Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Doctor } from './entities/doctor.entity';
import { User } from 'src/@common/entities/user.entity';
import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';

export abstract class DoctorsRepository {
  abstract createWithUser(
    userData: Partial<User>,
    doctorData: Partial<Doctor>,
  ): Promise<Doctor>;
}

export const DOCTORS_TYPEORM_REPOSITORY = 'DOCTOR_REPOSITORY';

@Injectable()
export class DoctorsTypeORMRepository implements DoctorsRepository {
  constructor(
    @Inject(DOCTORS_TYPEORM_REPOSITORY)
    private readonly repository: Repository<Doctor>,

    @Inject(DATASOURCE_TOKEN)
    private readonly dataSource: DataSource,
  ) {}

  async createWithUser(
    userData: Partial<User>,
    doctorData: Partial<Doctor>,
  ): Promise<Doctor> {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const doctorRepository = manager.getRepository(Doctor);

      const user = await userRepository.save(userRepository.create(userData));

      const doctor = doctorRepository.create({
        ...doctorData,
        user,
      });

      return doctorRepository.save(doctor);
    });
  }
}
