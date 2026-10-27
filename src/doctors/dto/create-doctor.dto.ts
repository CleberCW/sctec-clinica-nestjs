import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDoctorDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  crm!: string;

  @IsEmail()
  @MaxLength(255)
  contactEmail!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;
}
