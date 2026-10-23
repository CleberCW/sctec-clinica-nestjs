import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
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

  @IsNotEmpty({
    message: 'A senha não pode ser vazia.',
  })
  password!: string;
}
