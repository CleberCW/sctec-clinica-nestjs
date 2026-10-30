import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsNotEmpty } from 'class-validator';
import type { AppointmentStatus } from 'src/@common/entities/appointment.entity';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsNotEmpty({ message: 'O novo status é obrigatório' })
  status!: AppointmentStatus;
}
