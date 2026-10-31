import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { patientProviders } from './patients.providers';
import { MedicalRecordsService } from './medical-records.service';
import { medicalRecordProviders } from './medical-records.providers';
import { DoctorsModule } from 'src/doctors/doctors.module';

@Module({
  imports: [DoctorsModule],
  controllers: [PatientsController],
  providers: [
    PatientsService,
    MedicalRecordsService,
    ...patientProviders,
    ...medicalRecordProviders,
  ],
  exports: [PatientsService],
})
export class PatientsModule {}
