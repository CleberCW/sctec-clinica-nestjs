import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { patientProviders } from './patients.providers';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService, ...patientProviders],
  exports: [PatientsService],
})
export class PatientsModule {}
