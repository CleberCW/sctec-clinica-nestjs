import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PatientsService } from '../../src/patients/patients.service';
import { DuplicatePatientCpfError } from '../../src/@common/errors/duplicate-patient-cpf-error';

jest.mock('../../src/patients/patients.repository', () => ({
  PatientsRepository: class PatientsRepository {},
}));

jest.mock(
  'src/@common/entities/patient.entity',
  () => ({ Patient: class Patient {} }),
  { virtual: true },
);

jest.mock(
  'src/@common/errors/duplicate-patient-cpf-error',
  () =>
    jest.requireActual('../../src/@common/errors/duplicate-patient-cpf-error'),
  { virtual: true },
);

jest.mock(
  'src/@common/errors/domain.error',
  () => jest.requireActual('../../src/@common/errors/domain.error'),
  { virtual: true },
);

jest.mock(
  'src/@common/tools/validate.cpf',
  () => jest.requireActual('../../src/@common/tools/validate.cpf'),
  { virtual: true },
);

describe(PatientsService.name, () => {
  const patientsRepository = {
    create: jest.fn<() => Promise<unknown>>(),
    find: jest.fn<() => Promise<unknown>>(),
    findOne: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
    delete: jest.fn<() => Promise<unknown>>(),
  };

  let service: PatientsService;

  const validPatientDto = {
    name: 'Carlos Pereira',
    cpf: '529.982.247-25',
    birthDate: '1990-05-20',
    phone: '47999990000',
    email: 'carlos@medclinic.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatientsService(patientsRepository as never);
  });

  it('cadastra paciente com CPF válido e persiste somente os 11 dígitos', async () => {
    const patient = {
      id: 10,
      ...validPatientDto,
      cpf: '52998224725',
      deletedAt: null,
    };
    patientsRepository.findOne.mockResolvedValue(null);
    patientsRepository.create.mockResolvedValue(patient);

    await expect(service.create(validPatientDto as never)).resolves.toBe(
      patient,
    );

    expect(patientsRepository.findOne).toHaveBeenCalledWith({
      cpf: '52998224725',
    });
    expect(patientsRepository.create).toHaveBeenCalledWith({
      ...validPatientDto,
      cpf: '52998224725',
    });
  });

  it('rejeita CPF com dígitos verificadores inválidos antes de consultar o repositório', async () => {
    await expect(
      service.create({
        ...validPatientDto,
        cpf: '111.111.111-11',
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });

    expect(patientsRepository.findOne).not.toHaveBeenCalled();
    expect(patientsRepository.create).not.toHaveBeenCalled();
  });

  it('reativa paciente removido logicamente em vez de criar outro registro', async () => {
    const deletedPatient = {
      id: 19,
      cpf: '52998224725',
      deletedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const restoredPatient = {
      ...deletedPatient,
      ...validPatientDto,
      cpf: '52998224725',
      deletedAt: null,
    };

    patientsRepository.findOne.mockResolvedValue(deletedPatient);
    patientsRepository.update.mockResolvedValue(restoredPatient);

    await expect(service.create(validPatientDto as never)).resolves.toBe(
      restoredPatient,
    );

    expect(patientsRepository.update).toHaveBeenCalledWith(19, {
      ...validPatientDto,
      deletedAt: null,
    });
    expect(patientsRepository.create).not.toHaveBeenCalled();
  });

  it('traduz violação de unicidade do CPF para CPF_JA_CADASTRADO', async () => {
    patientsRepository.findOne.mockResolvedValue(null);
    patientsRepository.create.mockRejectedValue(new DuplicatePatientCpfError());

    await expect(
      service.create(validPatientDto as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        code: 'CPF_JA_CADASTRADO',
      },
    });
  });

  it('propaga erros de persistência que não sejam duplicidade de CPF', async () => {
    const databaseError = new Error('Falha inesperada no banco');
    patientsRepository.findOne.mockResolvedValue(null);
    patientsRepository.create.mockRejectedValue(databaseError);

    await expect(service.create(validPatientDto as never)).rejects.toBe(
      databaseError,
    );
  });

  it('lista pacientes delegando filtros e paginação ao repositório', async () => {
    const query = { page: 2, pageSize: 15, name: 'Carlos' };
    const patients = [{ id: 10, name: 'Carlos Pereira' }];
    patientsRepository.find.mockResolvedValue(patients);

    await expect(service.getAll(query as never)).resolves.toBe(patients);
    expect(patientsRepository.find).toHaveBeenCalledWith(query);
  });

  it('retorna um paciente pelo identificador', async () => {
    const patient = { id: 10, name: 'Carlos Pereira' };
    patientsRepository.findOne.mockResolvedValue(patient);

    await expect(service.getOne(10)).resolves.toBe(patient);
    expect(patientsRepository.findOne).toHaveBeenCalledWith({ id: 10 });
  });

  it('retorna RECURSO_NAO_ENCONTRADO quando o paciente não existe', async () => {
    patientsRepository.findOne.mockResolvedValue(null);

    await expect(service.getOne(999)).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });
  });

  it('atualiza os dados do paciente e mantém deletedAt nulo', async () => {
    const updatedPatient = { id: 10, name: 'Carlos Pereira Atualizado' };
    const dto = { name: 'Carlos Pereira Atualizado' };
    patientsRepository.update.mockResolvedValue(updatedPatient);

    await expect(service.update(10, dto as never)).resolves.toBe(
      updatedPatient,
    );

    expect(patientsRepository.update).toHaveBeenCalledWith(10, {
      ...dto,
      deletedAt: null,
    });
  });

  it('remove logicamente um paciente existente', async () => {
    patientsRepository.findOne.mockResolvedValue({ id: 10 });
    patientsRepository.delete.mockResolvedValue(undefined);

    await expect(service.delete(10)).resolves.toBeUndefined();

    expect(patientsRepository.findOne).toHaveBeenCalledWith({ id: 10 });
    expect(patientsRepository.delete).toHaveBeenCalledWith(10);
  });

  it('não tenta remover um paciente inexistente', async () => {
    patientsRepository.findOne.mockResolvedValue(null);

    await expect(service.delete(999)).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    expect(patientsRepository.delete).not.toHaveBeenCalled();
  });
});
