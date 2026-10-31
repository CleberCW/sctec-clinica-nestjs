import {
  MedicalRecordsRepository,
  MedicalRecordsTypeORMRepository,
} from './medical-records.repository';

export const medicalRecordProviders = [
  {
    provide: MedicalRecordsRepository,
    useClass: MedicalRecordsTypeORMRepository,
  },
];
