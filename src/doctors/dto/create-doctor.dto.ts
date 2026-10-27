import { OmitType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserRegisterDto } from 'src/users/dto/user-register.dto';

export class CreateDoctorDto extends OmitType(UserRegisterDto, [
  'roles',
] as const) {
  @IsString({ message: 'CRM precisa ser válido' })
  @IsNotEmpty({ message: 'CRM não pode estar vazio' })
  @MaxLength(255, { message: 'CRM deve ter no máximo 255 caracteres' })
  crm!: string;

  @IsString({ message: 'Phone precisa ser válido' })
  @IsNotEmpty({ message: 'Phone não pode estar vazio' })
  @MaxLength(20, { message: 'Phone deve ter no máximo 20 caracteres' })
  phone!: string;
}
