import { Expose } from 'class-transformer';

export class PatientResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  cpf!: string;

  @Expose()
  phone!: string;

  @Expose()
  email!: string;

  @Expose()
  birthDate!: string;

  @Expose()
  createdAt!: Date;
}
