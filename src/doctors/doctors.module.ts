import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { doctorsProviders } from './doctors.providers';
import { RoleModule } from 'src/roles/role.module';
import { doctorSchedulesProviders } from './doctors-schedules.providers';

@Module({
  imports: [RoleModule],
  controllers: [DoctorsController],
  providers: [DoctorsService, ...doctorsProviders, ...doctorSchedulesProviders],
})
export class DoctorsModule {}
