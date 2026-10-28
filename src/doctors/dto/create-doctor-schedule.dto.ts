import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDoctorScheduleItemDto } from './create-doctor-schedule-item.dto';

export class CreateDoctorSchedulesDto {
  @IsArray({ message: 'Os horários devem ser enviados em uma lista.' })
  @ArrayNotEmpty({ message: 'Informe pelo menos um horário.' })
  @ValidateNested({ each: true })
  @Type(() => CreateDoctorScheduleItemDto)
  shifts!: CreateDoctorScheduleItemDto[];
}
