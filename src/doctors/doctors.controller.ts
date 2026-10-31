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
  ParseIntPipe,
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
import { FindDoctorCalendarDto } from './dto/find-schedule.dto';
import { DoctorCalendarResponseDto } from './dto/doctor-calendar-response.dto';

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
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const patient = await this.doctorsService.getOne({ id: id });

    return plainToInstance(DoctorResponseDto, patient, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/:id/work-schedule')
  @UseGuards(JwtGuard)
  getSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getSchedule(id);
  }

  @Post('/:id/work-schedule')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN])
  @HttpCode(HttpStatus.OK)
  postSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() schedule: CreateDoctorSchedulesDto,
  ) {
    return this.doctorsService.postSchedule(id, schedule);
  }

  @Get(':id/calendar')
  @UseGuards(JwtGuard)
  async getCalendar(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindDoctorCalendarDto,
  ): Promise<DoctorCalendarResponseDto> {
    const calendar = await this.doctorsService.getCalendar(id, query);

    return plainToInstance(DoctorCalendarResponseDto, calendar, {
      excludeExtraneousValues: true,
    });
  }
}
