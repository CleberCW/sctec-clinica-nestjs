import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';
import { ROLES } from 'src/@common/entities/role.entity';
import type { RoleEnum } from 'src/@common/entities/role.entity';

export class UserRegisterDto {
  @IsString({
    message: 'O nome deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O nome não pode ser vazio.',
  })
  @Matches(/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u, {
    message: 'O nome deve conter apenas letras.',
  })
  name!: string;

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

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'A senha deve conter no mínimo 8 caracteres e pelo menos 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.',
    },
  )
  password!: string;

  @IsEnum(ROLES, { each: true })
  roles!: RoleEnum[];
}
