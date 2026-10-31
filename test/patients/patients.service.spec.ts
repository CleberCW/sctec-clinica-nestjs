import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PatientsService } from '../../src/patients/patients.service';
import { PatientsRepository } from '../../src/patients/patients.repository';
import { DuplicatePatientCpfError } from '../../src/@common/errors/duplicate-patient-cpf-error';
import { DomainError, ERROR_CODE } from '../../src/@common/errors/domain.error';

function errorCode(error: unknown): string | undefined {
  if (!(error instanceof DomainError)) return undefined;
  return (error.getResponse() as { code?: string }).code;
}

async function expectDomainError(
  operation: Promise<unknown>,
  expectedCode: ERROR_CODE,
): Promise<void> {
  const error = await operation.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(DomainError);
  expect(errorCode(error)).toBe(expectedCode);
}

describe(PatientsService.name, () => {
  const repository = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  let service: PatientsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatientsService(repository as unknown as PatientsRepository);
    repository.findOne.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 10,
      name: 'Carlos Pereira',
      cpf: '52998224725',
    });
    repository.find.mockResolvedValue([]);
    repository.update.mockResolvedValue({
      id: 10,
      name: 'Carlos Pereira',
      cpf: '52998224725',
      deletedAt: null,
    });
    repository.delete.mockResolvedValue(undefined);
  });

  describe('create', () => {
    it('creates a patient with a valid CPF and normalizes its digits', async () => {
      const result = await service.create({
        name: 'Carlos Pereira',
        cpf: '529.982.247-25',
      });

      expect(result.id).toBe(10);
      expect(repository.findOne).toHaveBeenCalledWith({ cpf: '52998224725' });
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Carlos Pereira',
        cpf: '52998224725',
      });
    });

    it('rejects an invalid CPF before accessing the repository', async () => {
      await expectDomainError(
        service.create({ name: 'Inválido', cpf: '11111111111' }),
        ERROR_CODE.DADOS_INVALIDOS,
      );
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('maps a database duplicate CPF error to the domain error code', async () => {
      repository.create.mockRejectedValue(new DuplicatePatientCpfError());

      await expectDomainError(
        service.create({ name: 'Carlos Pereira', cpf: '52998224725' }),
        ERROR_CODE.CPF_JA_CADASTRADO,
      );
    });

    it('reactivates a soft-deleted patient with the same CPF', async () => {
      repository.findOne.mockResolvedValue({
        id: 10,
        cpf: '52998224725',
        deletedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await service.create({ name: 'Carlos Pereira', cpf: '52998224725' });

      expect(repository.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          name: 'Carlos Pereira',
          cpf: '52998224725',
          deletedAt: null,
        }),
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  it('delegates patient listing to the repository', async () => {
    const query = { page: 2, pageSize: 10, name: 'Carlos' };
    await service.getAll(query);
    expect(repository.find).toHaveBeenCalledWith(query);
  });

  describe('getOne', () => {
    it('returns the matching patient', async () => {
      const patient = { id: 10, name: 'Carlos Pereira' };
      repository.findOne.mockResolvedValue(patient);
      await expect(service.getOne(10)).resolves.toBe(patient);
    });

    it('returns not found when the patient does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expectDomainError(
        service.getOne(404),
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    });
  });

  it('updates the patient and clears a soft-delete marker', async () => {
    await service.update(10, { name: 'Carlos P.' });
    expect(repository.update).toHaveBeenCalledWith(10, {
      name: 'Carlos P.',
      deletedAt: null,
    });
  });

  describe('delete', () => {
    it('soft-deletes an existing patient', async () => {
      repository.findOne.mockResolvedValue({ id: 10 });
      await expect(service.delete(10)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith(10);
    });

    it('returns not found when deleting a patient that does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expectDomainError(
        service.delete(404),
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
