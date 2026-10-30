import { Injectable } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsRepository } from './patients.repository';
import { Patient } from 'src/@common/entities/patient.entity';
import { DuplicatePatientCpfError } from 'src/@common/errors/duplicate-patient-cpf-error';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import { isValidCpf } from 'src/@common/tools/validate.cpf';
import { GetPatientsDto } from './dto/get-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    try {
      if (!isValidCpf(dto.cpf)) {
        throw new DomainError('CPF inválido', ERROR_CODE.DADOS_INVALIDOS);
      }
      const existingPatient = await this.patientsRepository.findOne({
        cpf: dto.cpf.replace(/\D/g, ''),
      });

      if (existingPatient && existingPatient.deletedAt) {
        return await this.patientsRepository.update(existingPatient.id, {
          ...dto,
          deletedAt: null,
        });
      }

      return await this.patientsRepository.create({
        ...dto,
        cpf: dto.cpf.replace(/\D/g, ''),
      });
    } catch (error: unknown) {
      if (error instanceof DuplicatePatientCpfError) {
        throw new DomainError(
          'Já há um paciente cadastrado com este CPF.',
          ERROR_CODE.CPF_JA_CADASTRADO,
        );
      }

      throw error;
    }
  }

  async getAll(query: GetPatientsDto): Promise<Patient[]> {
    return this.patientsRepository.find(query);
  }

  async getOne(id: number): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({ id: id });

    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    return patient;
  }

  async update(id: number, dto: UpdatePatientDto): Promise<Patient> {
    return await this.patientsRepository.update(id, {
      ...dto,
      deletedAt: null,
    });
  }

  async delete(id: number): Promise<void> {
    const patient = await this.patientsRepository.findOne({ id: id });

    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    await this.patientsRepository.delete(id);
  }
}
