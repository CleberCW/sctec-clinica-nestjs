import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { doctorsProviders } from './doctors.providers';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, ...doctorsProviders],
})
export class DoctorsModule {}
