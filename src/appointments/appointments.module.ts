import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { DoctorsModule } from 'src/doctors/doctors.module';
import { PatientsModule } from 'src/patients/patients.module';
import { appointmentProviders } from './appointments.providers';

@Module({
  imports: [DoctorsModule, PatientsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, ...appointmentProviders],
})
export class AppointmentsModule {}
