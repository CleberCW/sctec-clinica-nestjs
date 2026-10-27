import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { doctorsProviders } from './doctors.providers';
import { RoleModule } from 'src/roles/role.module';

@Module({
  imports: [RoleModule],
  controllers: [DoctorsController],
  providers: [DoctorsService, ...doctorsProviders],
})
export class DoctorsModule {}
