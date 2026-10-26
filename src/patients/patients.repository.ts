import { QueryFailedError, Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Patient } from 'src/@common/entities/patient.entity';
import { DuplicatePatientCpfError } from 'src/@common/errors/duplicate-patient-cpf-error';

export abstract class PatientsRepository {
  abstract create(patientData: Partial<Patient>): Promise<Patient>;
}

interface PostgresError {
  code?: string;
  constraint?: string;
}

export const PATIENT_TYPEORM_REPOSITORY = 'PATIENT_REPOSITORY';

@Injectable()
export class PatientsTypeORMRepository implements PatientsRepository {
  constructor(
    @Inject(PATIENT_TYPEORM_REPOSITORY)
    private readonly repository: Repository<Patient>,
  ) {}

  async create(patientData: Partial<Patient>): Promise<Patient> {
    const newPatient = this.repository.create(patientData);

    try {
      return await this.repository.save(newPatient);
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as PostgresError).code === '23505' &&
        (error.driverError as PostgresError).constraint === 'UQ_PATIENT_CPF'
      ) {
        throw new DuplicatePatientCpfError();
      }

      throw error;
    }
  }
}
