import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsEmail,
  IsDateString,
} from 'class-validator';

export class CreatePatientDto {
  @IsString({
    message: 'O nome deve ser um texto.',
  })
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  @MaxLength(50, { message: 'O nome deve ter no máximo 50 caracteres.' })
  firstName!: string;

  @IsString({
    message: 'O sobrenome deve ser um texto.',
  })
  @IsNotEmpty({ message: 'O sobrenome não pode ser vazio.' })
  @MaxLength(100, { message: 'O sobrenome deve ter no máximo 50 caracteres.' })
  lastName!: string;

  @IsNotEmpty({ message: 'O CPF não pode ser vazio.' })
  @Matches(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/, {
    message: 'O CPF deve ter formato válido.',
  })
  cpf!: string;

  @IsNotEmpty({
    message: 'A data de nascimento não pode ser vazia.',
  })
  @IsDateString(
    { strict: true },
    { message: 'A data de nascimento deve ser válida.' },
  )
  birthDate!: string;

  @IsPhoneNumber('BR', {
    message: 'O telefone deve ser um número de telefone brasileiro.',
  })
  @MaxLength(11, {
    message: 'O telefone deve ter no máximo 11 caracteres.',
  })
  @IsNotEmpty({
    message: 'O telefone não pode ser vazio.',
  })
  phone!: string;

  @IsEmail(
    {},
    {
      message: 'O email deve ser válido.',
    },
  )
  @IsNotEmpty({
    message: 'O email não pode ser vazio.',
  })
  email!: string;
}
