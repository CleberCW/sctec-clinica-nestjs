import { Expose, Type } from 'class-transformer';
import { DoctorWorkScheduleResponseDto } from './doctor-work-schedule-response.dto';
import { DoctorCalendarAppointmentResponseDto } from './doctor-appointment-response.dto';

export class DoctorCalendarResponseDto {
  @Expose()
  @Type(() => DoctorWorkScheduleResponseDto)
  workSchedule!: DoctorWorkScheduleResponseDto;

  @Expose()
  @Type(() => DoctorCalendarAppointmentResponseDto)
  appointments!: DoctorCalendarAppointmentResponseDto[];
}
