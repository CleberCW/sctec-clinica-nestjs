import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { DataSource } from 'typeorm';
import {
  DOCTORS_TYPEORM_REPOSITORY,
  DoctorsRepository,
  DoctorsTypeORMRepository,
} from './doctors.repository';
import { Doctor } from './entities/doctor.entity';

export const doctorsProviders = [
  {
    provide: DOCTORS_TYPEORM_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Doctor),
    inject: [DATASOURCE_TOKEN],
  },
  {
    provide: DoctorsRepository,
    useClass: DoctorsTypeORMRepository,
  },
];
