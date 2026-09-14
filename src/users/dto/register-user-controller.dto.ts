import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsString({
    message: 'O primeiro nome deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O primeiro nome não pode ser vazio.',
  })
  @Matches(/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u, {
    message: 'O primeiro nome deve conter apenas letras.',
  })
  firstName!: string;

  @IsString({
    message: 'O sobrenome deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O sobrenome não pode ser vazio.',
  })
  @Matches(/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u, {
    message: 'O sobrenome deve conter apenas letras.',
  })
  lastName!: string;

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

  @IsString({
    message: 'A senha deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'A senha não pode ser vazia.',
  })
  @MinLength(8, {
    message: 'A senha deve ter no mínimo 8 caracteres.',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'A senha deve conter pelo menos 1 letra maiúscula, 1 minúscula e 1 número ou caractere especial.',
  })
  password!: string;
}
