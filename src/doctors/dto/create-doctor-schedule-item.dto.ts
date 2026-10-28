import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import type { DayOfWeek } from 'src/@common/entities/doctorSchedule.entity';

export class CreateDoctorScheduleItemDto {
  @IsInt({ message: 'O dia da semana deve ser um número inteiro.' })
  @Min(0, { message: 'O dia da semana deve estar entre 0 e 6.' })
  @Max(6, { message: 'O dia da semana deve estar entre 0 e 6.' })
  weekDay!: DayOfWeek;

  @IsString()
  @IsNotEmpty({ message: 'O horário inicial é obrigatório.' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'O horário inicial deve estar no formato HH:mm.',
  })
  startTime!: string;

  @IsString()
  @IsNotEmpty({ message: 'O horário final é obrigatório.' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'O horário final deve estar no formato HH:mm.',
  })
  endTime!: string;

  @IsInt({ message: 'A duração do atendimento deve ser um número inteiro.' })
  @Min(30, { message: 'A duração mínima do atendimento é de 30 minutos.' })
  @Max(120, { message: 'A duração máxima do atendimento é de 120 minutos.' })
  slotDurationMinutes!: number;
}
