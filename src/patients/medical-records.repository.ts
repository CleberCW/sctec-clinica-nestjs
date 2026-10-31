import { Injectable, Inject } from '@nestjs/common';
import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { MedicalRecordEntry } from 'src/@common/entities/medicalRecord.entity';
import { DataSource } from 'typeorm';

export const MEDICAL_RECORDS_REPOSITORY = 'MEDICAL_RECORDS_REPOSITORY';

export abstract class MedicalRecordsRepository {
  abstract createMedicalRecord(
    recordInfo: Partial<MedicalRecordEntry>,
  ): Promise<MedicalRecordEntry>;

  abstract getMedicalRecordsByPatient(
    patientId: number,
    doctorId?: number,
  ): Promise<MedicalRecordEntry[]>;
}

@Injectable()
export class MedicalRecordsTypeORMRepository implements MedicalRecordsRepository {
  constructor(
    @Inject(DATASOURCE_TOKEN)
    private readonly dataSource: DataSource,
  ) {}

  async createMedicalRecord(
    recordInfo: Partial<MedicalRecordEntry>,
  ): Promise<MedicalRecordEntry> {
    const repository = this.dataSource.getRepository(MedicalRecordEntry);
    const entity = repository.create(recordInfo);
    return repository.save(entity);
  }

  async getMedicalRecordsByPatient(
    patientId: number,
    doctorId?: number,
  ): Promise<MedicalRecordEntry[]> {
    const repository = this.dataSource.getRepository(MedicalRecordEntry);

    return repository.find({
      where: {
        patientId,
        ...(doctorId !== undefined && { doctorId }),
      },
    });
  }
}
