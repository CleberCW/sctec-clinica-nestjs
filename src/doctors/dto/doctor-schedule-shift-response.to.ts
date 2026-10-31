import { Expose } from 'class-transformer';
import { type DayOfWeek } from 'src/@common/entities/doctorSchedule.entity';

export class DoctorScheduleShiftResponseDto {
  @Expose()
  weekDay!: DayOfWeek;

  @Expose()
  startTime!: string;

  @Expose()
  endTime!: string;

  @Expose()
  slotDurationMinutes!: number;
}
