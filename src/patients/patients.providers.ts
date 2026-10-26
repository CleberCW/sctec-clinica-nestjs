import { DataSource } from 'typeorm';
import {
  PATIENT_TYPEORM_REPOSITORY,
  PatientsRepository,
  PatientsTypeORMRepository,
} from './patients.repository';
import { Patient } from 'src/@common/entities/patient.entity';
import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';

export const patientProviders = [
  {
    provide: PATIENT_TYPEORM_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Patient),
    inject: [DATASOURCE_TOKEN],
  },
  {
    provide: PatientsRepository,
    useClass: PatientsTypeORMRepository,
  },
];
