import { Expose, Type } from 'class-transformer';
import { DoctorScheduleShiftResponseDto } from './doctor-schedule-shift-response.to';

export class DoctorWorkScheduleResponseDto {
  @Expose()
  @Type(() => DoctorScheduleShiftResponseDto)
  shifts!: DoctorScheduleShiftResponseDto[];
}
