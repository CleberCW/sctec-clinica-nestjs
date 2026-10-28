import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { RequireRole } from 'src/@common/decorators/roles.decorator';
import { ROLES } from 'src/@common/entities/role.entity';
import { JwtGuard } from 'src/@common/guards/jwt.guard';
import { plainToInstance } from 'class-transformer';
import { DoctorResponseDto } from './dto/doctor-response.dto';
import { GetDoctorsDto } from './dto/get-doctors.dto';
import { CreateDoctorSchedulesDto } from './dto/create-doctor-schedule.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN])
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    const doctor = await this.doctorsService.create(createDoctorDto);

    return plainToInstance(DoctorResponseDto, doctor, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  async getAll(@Query() query: GetDoctorsDto) {
    const doctors = await this.doctorsService.getAll(query);

    return plainToInstance(DoctorResponseDto, doctors, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/:id')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  async getOne(@Param('id') id: number) {
    const patient = await this.doctorsService.getOne(id);

    return plainToInstance(DoctorResponseDto, patient, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/:id/work-schedule')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  getSchedule(@Param('id') id: number) {
    return this.doctorsService.getSchedule(id);
  }

  @Post('/:id/work-schedule')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  @HttpCode(HttpStatus.OK)
  postSchedule(
    @Param('id') id: number,
    @Body() schedule: CreateDoctorSchedulesDto,
  ) {
    return this.doctorsService.postSchedule(id, schedule);
  }
}
