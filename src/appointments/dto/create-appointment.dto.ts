import {
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber({}, { message: 'O ID do paciente deve ser um número.' })
  @IsNotEmpty({ message: 'O ID do paciente é obrigatório.' })
  patientId!: number;

  @IsNumber({}, { message: 'O ID do médico deve ser um número.' })
  @IsNotEmpty({ message: 'O ID do médico é obrigatório.' })
  doctorId!: number;

  @IsISO8601(
    { strict: true },
    { message: 'A data deve estar no formato ISO 8601.' },
  )
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'A data deve conter um fuso horário explícito.',
  })
  startsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
