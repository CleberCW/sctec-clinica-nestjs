import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RequireRole } from 'src/@common/decorators/roles.decorator';
import { ROLES } from 'src/@common/entities/role.entity';
import { JwtGuard } from 'src/@common/guards/jwt.guard';
import { plainToInstance } from 'class-transformer';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';
import { CurrentUser } from 'src/@common/decorators/current-user.decorator';
import type { AuthUserDto } from 'src/users/dto/auth-user.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    const appointment =
      await this.appointmentsService.create(createAppointmentDto);

    return plainToInstance(AppointmentResponseDto, appointment, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR])
  async getAll(
    @Query() findAppointmentsDto: FindAppointmentsDto,
    @CurrentUser() user: AuthUserDto,
  ) {
    const appointments = await this.appointmentsService.getAll(
      findAppointmentsDto,
      user,
    );

    return appointments.map((appointment) =>
      plainToInstance(AppointmentResponseDto, appointment, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get('/:id')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR])
  async getById(@Param('id') id: number, @CurrentUser() user: AuthUserDto) {
    const appointment = await this.appointmentsService.getById(id, user);

    return plainToInstance(AppointmentResponseDto, appointment, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('/:id/status')
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR])
  async update(
    @Param('id') id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user: AuthUserDto,
  ) {
    const appointment = await this.appointmentsService.update(
      id,
      updateAppointmentDto,
      user,
    );

    return plainToInstance(AppointmentResponseDto, appointment, {
      excludeExtraneousValues: true,
    });
  }
}
