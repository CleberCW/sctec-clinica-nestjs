import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryFailedError } from 'typeorm';
import { AppointmentsTypeORMRepository } from '../../src/appointments/appointments.repository';

jest.mock(
  'src/@common/database/database.providers',
  () => ({ DATASOURCE_TOKEN: 'DATASOURCE_TOKEN' }),
  { virtual: true },
);

jest.mock(
  'src/@common/entities/appointment.entity',
  () => ({ Appointment: class Appointment {} }),
  { virtual: true },
);

jest.mock(
  'src/@common/errors/domain.error',
  () => jest.requireActual('../../src/@common/errors/domain.error'),
  { virtual: true },
);

describe(AppointmentsTypeORMRepository.name, () => {
  const appointmentRepository = {
    create: jest.fn<(...args: any[]) => any>(),
    save: jest.fn<(...args: any[]) => any>(),
  };
  const dataSource = {
    getRepository: jest.fn<(...args: any[]) => any>(),
  };

  let repository: AppointmentsTypeORMRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new AppointmentsTypeORMRepository(dataSource as never);
    dataSource.getRepository.mockReturnValue(appointmentRepository);
    appointmentRepository.create.mockImplementation((value) => value);
  });

  it('mapeia violação da restrição de sobreposição do médico para HORARIO_INDISPONIVEL', async () => {
    const databaseError = new QueryFailedError('INSERT', [], {
      code: '23P01',
      constraint: 'EXCL_APPOINTMENT_DOCTOR_OVERLAP',
    } as never);
    appointmentRepository.save.mockRejectedValue(databaseError);

    await expect(
      repository.create({
        doctorId: 3,
        patientId: 10,
        startsAt: new Date('2026-11-02T11:00:00.000Z'),
        endsAt: new Date('2026-11-02T11:30:00.000Z'),
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        code: 'HORARIO_INDISPONIVEL',
      },
    });
  });

  it('mapeia violação da restrição de sobreposição do paciente para PACIENTE_INDISPONIVEL', async () => {
    const databaseError = new QueryFailedError('INSERT', [], {
      code: '23P01',
      constraint: 'EXCL_APPOINTMENT_PATIENT_OVERLAP',
    } as never);
    appointmentRepository.save.mockRejectedValue(databaseError);

    await expect(
      repository.create({
        doctorId: 3,
        patientId: 10,
        startsAt: new Date('2026-11-02T11:00:00.000Z'),
        endsAt: new Date('2026-11-02T11:30:00.000Z'),
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 409,
        code: 'PACIENTE_INDISPONIVEL',
      },
    });
  });

  it('propaga outras falhas do banco sem mascarar a causa', async () => {
    const databaseError = new QueryFailedError('INSERT', [], {
      code: '23503',
      constraint: 'FK_APPOINTMENT_DOCTOR',
    } as never);
    appointmentRepository.save.mockRejectedValue(databaseError);

    await expect(repository.create({ doctorId: 999 })).rejects.toBe(
      databaseError,
    );
  });

  it('cria e persiste consulta pelo repositório associado à transação de dados', async () => {
    const appointmentData = {
      doctorId: 3,
      patientId: 10,
      startsAt: new Date('2026-11-02T11:00:00.000Z'),
      endsAt: new Date('2026-11-02T11:30:00.000Z'),
      status: 'scheduled',
    };
    const savedAppointment = { id: 41, ...appointmentData };
    appointmentRepository.save.mockResolvedValue(savedAppointment);

    await expect(repository.create(appointmentData)).resolves.toBe(
      savedAppointment,
    );

    expect(dataSource.getRepository).toHaveBeenCalledTimes(1);
    expect(appointmentRepository.create).toHaveBeenCalledWith(appointmentData);
    expect(appointmentRepository.save).toHaveBeenCalled();
  });
});
