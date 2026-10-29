import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RequireRole } from 'src/@common/decorators/roles.decorator';
import { ROLES } from 'src/@common/entities/role.entity';
import { JwtGuard } from 'src/@common/guards/jwt.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN, ROLES.SECRETARY])
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }
}
