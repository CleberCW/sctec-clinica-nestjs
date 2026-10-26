import {
  Controller,
  Post,
  Body,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtGuard } from 'src/@common/guards/jwt.guard';
import { RequireRole } from 'src/@common/decorators/roles.decorator';
import { ROLES } from 'src/@common/entities/role.entity';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  @UseInterceptors(ClassSerializerInterceptor)
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }
}
