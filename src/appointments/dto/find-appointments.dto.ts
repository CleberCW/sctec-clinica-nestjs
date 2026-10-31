import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import {
  APPOINTMENT_STATUSES,
  type AppointmentStatus,
} from 'src/@common/entities/appointment.entity';

export class FindAppointmentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ID do médico deve ser um número inteiro.' })
  @Min(1, { message: 'O ID do médico deve ser maior que zero.' })
  doctorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ID do paciente deve ser um número inteiro.' })
  @Min(1, { message: 'O ID do paciente deve ser maior que zero.' })
  patientId?: number;

  @IsOptional()
  @IsEnum(APPOINTMENT_STATUSES, {
    message:
      'O status informado é inválido. Valores permitidos: scheduled, in_progress, done ou cancelled.',
  })
  status?: AppointmentStatus;

  @IsOptional()
  @IsDateString(
    { strict: true },
    {
      message: 'A data inicial deve estar no formato YYYY-MM-DD e ser válida.',
    },
  )
  from?: string;

  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'A data final deve estar no formato YYYY-MM-DD e ser válida.' },
  )
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O tamanho da página deve ser um número inteiro.' })
  @Min(1, { message: 'O tamanho da página deve ser no mínimo 1.' })
  @Max(100, { message: 'O tamanho da página não pode ultrapassar 100.' })
  pageSize?: number;
}
