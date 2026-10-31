import { IsDateString, Matches } from 'class-validator';

export class FindDoctorCalendarDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data inicial deve estar no formato YYYY-MM-DD.',
  })
  @IsDateString(
    { strict: true },
    { message: 'A data inicial informada é inválida.' },
  )
  from!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data final deve estar no formato YYYY-MM-DD.',
  })
  @IsDateString(
    { strict: true },
    { message: 'A data final informada é inválida.' },
  )
  to!: string;
}
