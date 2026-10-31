import { Expose } from 'class-transformer';

export class MedicalRecordEntryRepsonseDto {
  @Expose()
  id!: string;

  @Expose()
  patientId!: number;

  @Expose()
  doctorId!: number;

  @Expose()
  text!: string;

  @Expose()
  createdAt!: Date;
}
