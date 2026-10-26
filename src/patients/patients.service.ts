import { Injectable } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsRepository } from './patients.repository';
import { Patient } from 'src/@common/entities/patient.entity';
import { DuplicatePatientCpfError } from 'src/@common/errors/duplicate-patient-cpf-error';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import { isValidCpf } from 'src/@common/tools/validate.cpf';

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    try {
      if (!isValidCpf(dto.cpf)) {
        throw new DomainError('CPF inválido', ERROR_CODE.DADOS_INVALIDOS);
      }
      return await this.patientsRepository.create({
        ...dto,
        cpf: dto.cpf.replace(/\D/g, ''),
      });
    } catch (error: unknown) {
      if (error instanceof DuplicatePatientCpfError) {
        throw new DomainError(
          'Este CPF já está cadastrado.',
          ERROR_CODE.CPF_JA_CADASTRADO,
        );
      }

      throw error;
    }
  }
}
