import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryFailedError } from 'typeorm';
import { DoctorsTypeORMRepository } from '../../src/doctors/doctors.repository';

jest.mock(
  'src/@common/database/database.providers',
  () => ({ DATASOURCE_TOKEN: 'DATASOURCE_TOKEN' }),
  { virtual: true },
);

jest.mock(
  'src/@common/entities/user.entity',
  () => ({ User: class User {} }),
  { virtual: true },
);

jest.mock(
  'src/@common/entities/doctor.entity',
  () => ({ Doctor: class Doctor {} }),
  { virtual: true },
);

jest.mock(
  'src/@common/entities/appointment.entity',
  () => ({ APPOINTMENT_STATUSES: { CANCELLED: 'cancelled' } }),
  { virtual: true },
);

jest.mock(
  'src/@common/errors/domain.error',
  () => jest.requireActual('../../src/@common/errors/domain.error'),
  { virtual: true },
);

describe(DoctorsTypeORMRepository.name, () => {
  const userRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const doctorRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  let repository: DoctorsTypeORMRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new DoctorsTypeORMRepository(
      {} as never,
      dataSource as never,
    );

    manager.getRepository.mockImplementation((entity) => {
      if (entity.name === 'User') return userRepository;
      return doctorRepository;
    });
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );
    userRepository.create.mockImplementation((value) => ({ ...value }));
    doctorRepository.create.mockImplementation((value) => ({ ...value }));
  });

  it('cria usuário e registro profissional dentro da mesma transação', async () => {
    const userData = {
      name: 'Helena Souza',
      email: 'helena@medclinic.com',
      password: 'hash',
      roles: [{ id: 3, name: 'DOCTOR' }],
    };
    const doctorData = {
      crm: 'CRM-SC-54321',
      contactEmail: 'helena@medclinic.com',
      phone: '47999990000',
    };
    const savedUser = { id: 30, ...userData };
    const savedDoctor = {
      id: 3,
      ...doctorData,
      user: savedUser,
    };

    userRepository.save.mockResolvedValue(savedUser);
    doctorRepository.save.mockResolvedValue(savedDoctor);

    await expect(
      repository.createWithUser(userData as never, doctorData as never),
    ).resolves.toBe(savedDoctor);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.getRepository).toHaveBeenCalledTimes(2);
    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(doctorRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ...doctorData,
        user: savedUser,
      }),
    );
  });

  it('não tenta criar médico quando a gravação do usuário falha', async () => {
    const databaseError = new Error('Falha ao salvar usuário');
    userRepository.save.mockRejectedValue(databaseError);

    await expect(
      repository.createWithUser(
        { email: 'helena@medclinic.com' } as never,
        { crm: 'CRM-SC-54321' } as never,
      ),
    ).rejects.toBe(databaseError);

    expect(doctorRepository.save).not.toHaveBeenCalled();
  });

  it('propaga falha ao gravar médico para que a transação seja revertida', async () => {
    const savedUser = { id: 30, email: 'helena@medclinic.com' };
    const databaseError = new Error('Falha ao salvar médico');
    userRepository.save.mockResolvedValue(savedUser);
    doctorRepository.save.mockRejectedValue(databaseError);

    await expect(
      repository.createWithUser(
        { email: 'helena@medclinic.com' } as never,
        { crm: 'CRM-SC-54321' } as never,
      ),
    ).rejects.toBe(databaseError);

    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(doctorRepository.save).toHaveBeenCalledTimes(1);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('converte violação de e-mail único para EMAIL_JA_CADASTRADO', async () => {
    const duplicateEmail = new QueryFailedError('INSERT', [], {
      code: '23505',
      constraint: 'UQ_USER_EMAIL',
    } as never);
    userRepository.save.mockRejectedValue(duplicateEmail);

    await expect(
      repository.createWithUser(
        { email: 'duplicado@medclinic.com' } as never,
        { crm: 'CRM-SC-54321' } as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        code: 'EMAIL_JA_CADASTRADO',
      },
    });
  });

  it('converte violação de CRM único para CRM_JA_CADASTRADO', async () => {
    const savedUser = { id: 30, email: 'helena@medclinic.com' };
    const duplicateCrm = new QueryFailedError('INSERT', [], {
      code: '23505',
      constraint: 'UQ_DOCTOR_CRM',
    } as never);
    userRepository.save.mockResolvedValue(savedUser);
    doctorRepository.save.mockRejectedValue(duplicateCrm);

    await expect(
      repository.createWithUser(
        { email: 'nova@medclinic.com' } as never,
        { crm: 'CRM-SC-54321' } as never,
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        code: 'CRM_JA_CADASTRADO',
      },
    });
  });

  it('propaga erro de unicidade desconhecido sem convertê-lo em outro código', async () => {
    const databaseError = new QueryFailedError('INSERT', [], {
      code: '23505',
      constraint: 'UQ_UNKNOWN',
    } as never);
    userRepository.save.mockRejectedValue(databaseError);

    await expect(
      repository.createWithUser(
        { email: 'nova@medclinic.com' } as never,
        { crm: 'CRM-SC-54321' } as never,
      ),
    ).rejects.toBe(databaseError);
  });
});
