import { IsNull, Like, QueryFailedError, Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Patient } from 'src/@common/entities/patient.entity';
import { DuplicatePatientCpfError } from 'src/@common/errors/duplicate-patient-cpf-error';
import { GetPatientsDto } from './dto/get-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';

export abstract class PatientsRepository {
  abstract create(patientData: Partial<Patient>): Promise<Patient>;
  abstract find(query: GetPatientsDto): Promise<Patient[]>;
  abstract findOne(filters: {
    id?: number;
    cpf?: string;
  }): Promise<Patient | null>;
  abstract update(id: number, dto: UpdatePatientDto): Promise<Patient>;
  abstract delete(id: number): Promise<void>;
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

  async find(query: GetPatientsDto): Promise<Patient[]> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    return this.repository.find({
      skip: pageSize * (page - 1),
      take: pageSize,
      where: {
        ...(query.name?.trim() && {
          name: Like(`%${query.name.trim()}%`),
        }),
      },
    });
  }

  async findOne(filters: {
    id?: number;
    cpf?: string;
  }): Promise<Patient | null> {
    return this.repository.findOne({
      where: {
        ...filters,
        deletedAt: IsNull(),
      },
    });
  }

  async update(id: number, dto: UpdatePatientDto): Promise<Patient> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Patient)
      .set(dto)
      .where('id = :id', { id })
      .returning('*')
      .execute();

    if (result.affected === 0) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    const patient = result.raw as Patient[];

    return patient[0];
  }

  async delete(id: number): Promise<void> {
    const result = await this.repository.update(id, { deletedAt: new Date() });

    if (result.affected === 0) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }
  }
}
