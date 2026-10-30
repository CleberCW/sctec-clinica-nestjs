import { Expose } from 'class-transformer';
import type { AppointmentStatus } from 'src/@common/entities/appointment.entity';

export class AppointmentResponseDto {
  @Expose()
  id!: number;

  @Expose()
  doctorId!: number;

  @Expose()
  patientId!: number;

  @Expose()
  startsAt!: Date;

  @Expose()
  endsAt!: Date;

  @Expose()
  status!: AppointmentStatus;

  @Expose()
  notes!: string;
}
