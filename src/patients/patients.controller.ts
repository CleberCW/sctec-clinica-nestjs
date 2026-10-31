import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtGuard } from 'src/@common/guards/jwt.guard';
import { RequireRole } from 'src/@common/decorators/roles.decorator';
import { ROLES } from 'src/@common/entities/role.entity';
import { plainToInstance } from 'class-transformer';
import { PatientResponseDto } from './dto/patient-response.dto';
import { GetPatientsDto } from './dto/get-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordEntryRepsonseDto } from './dto/medical-record.response.dto';
import { CurrentUser } from 'src/@common/decorators/current-user.decorator';
import type { AuthUserDto } from 'src/users/dto/auth-user.dto';

@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly medicalRecordsService: MedicalRecordsService,
  ) {}

  @Post()
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  async create(@Body() createPatientDto: CreatePatientDto) {
    const patientEntity = await this.patientsService.create(createPatientDto);

    return plainToInstance(PatientResponseDto, patientEntity, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(JwtGuard)
  async getAll(@Query() query: GetPatientsDto) {
    const patients = await this.patientsService.getAll(query);

    return plainToInstance(PatientResponseDto, patients, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/:id')
  @UseGuards(JwtGuard)
  async getOne(@Param('id') id: number) {
    const patient = await this.patientsService.getOne(id);

    return plainToInstance(PatientResponseDto, patient, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('/:id')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  async update(
    @Param('id') id: number,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    const patient = await this.patientsService.update(id, updatePatientDto);

    return plainToInstance(PatientResponseDto, patient, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('/:id')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: number) {
    await this.patientsService.delete(id);

    return { message: 'Paciente excluído com sucesso' };
  }

  @Post('/:id/medical-records')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.DOCTOR])
  async createMedicalRecord(
    @Param('id') patientId: number,
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
    @CurrentUser() user: AuthUserDto,
  ) {
    const patient = await this.medicalRecordsService.createMedicalRecord(
      patientId,
      createMedicalRecordDto,
      user,
    );

    return plainToInstance(MedicalRecordEntryRepsonseDto, patient, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/:id/medical-records')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.DOCTOR])
  async getMedicalRecords(
    @Param('id') patientId: number,
    @CurrentUser() user: AuthUserDto,
  ) {
    const medicalRecords =
      await this.medicalRecordsService.getMedicalRecordsByPatientId(
        patientId,
        user,
      );

    return plainToInstance(MedicalRecordEntryRepsonseDto, medicalRecords, {
      excludeExtraneousValues: true,
    });
  }
}
