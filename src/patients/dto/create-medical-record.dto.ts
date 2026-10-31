import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsOptional()
  @IsNumber({}, { message: 'O ID da consulta deve ser um número.' })
  appointmentId?: number;

  @IsString({ message: 'O texto do registro médico deve ser uma string.' })
  text!: string;
}
