import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AppointmentsService } from '../../src/appointments/appointments.service';

jest.mock(
  'src/@common/errors/domain.error',
  () => jest.requireActual('../../src/@common/errors/domain.error'),
  { virtual: true },
);
jest.mock(
  'src/@common/utils/utils',
  () => jest.requireActual('../../src/@common/utils/utils'),
  { virtual: true },
);
jest.mock(
  'src/@common/entities/appointment.entity',
  () => ({
    APPOINTMENT_STATUSES: {
      SCHEDULED: 'scheduled',
      IN_PROGRESS: 'in_progress',
      DONE: 'done',
      CANCELLED: 'cancelled',
    },
  }),
  { virtual: true },
);
jest.mock(
  'src/@common/entities/role.entity',
  () => ({
    ROLES: { ADMIN: 'admin', SECRETARY: 'secretary', DOCTOR: 'doctor' },
  }),
  { virtual: true },
);
jest.mock(
  'src/doctors/doctors.service',
  () => ({ DoctorsService: class DoctorsService {} }),
  { virtual: true },
);
jest.mock(
  'src/patients/patients.service',
  () => ({ PatientsService: class PatientsService {} }),
  { virtual: true },
);
jest.mock('../../src/appointments/appointments.repository', () => ({
  AppointmentsRepository: class AppointmentsRepository {},
}));

describe('AppointmentsService - vínculo entre usuário e médico', () => {
  const appointmentsRepository = {
    create: jest.fn<() => Promise<unknown>>(),
    findById: jest.fn<() => Promise<unknown>>(),
    hasPatientConflict: jest.fn<() => Promise<boolean>>(),
    hasConflict: jest.fn<() => Promise<boolean>>(),
    find: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
  };
  const doctorsService = {
    getOne: jest.fn<() => Promise<unknown>>(),
  };
  const patientsService = {
    getOne: jest.fn<() => Promise<unknown>>(),
  };

  let service: AppointmentsService;

  const doctorUser = {
    sub: '30',
    data: {
      email: 'medico@medclinic.com',
      roles: ['doctor'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppointmentsService(
      appointmentsRepository as never,
      doctorsService as never,
      patientsService as never,
    );
    doctorsService.getOne.mockResolvedValue({
      id: 3,
      userId: 30,
    });
  });

  it('autoriza médico quando o agendamento pertence ao cadastro profissional ligado ao usuário autenticado', async () => {
    const appointment = {
      id: 41,
      doctorId: 3,
      patientId: 10,
      status: 'scheduled',
    };
    appointmentsRepository.findById.mockResolvedValue(appointment);

    await expect(service.getById(41, doctorUser as never)).resolves.toBe(
      appointment,
    );

    expect(doctorsService.getOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 30 }),
    );
  });

  it('nega acesso quando o cadastro profissional do usuário não é o médico do agendamento', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 99,
      patientId: 10,
      status: 'scheduled',
    });

    await expect(
      service.getById(41, doctorUser as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });
  });

  it('permite ao médico responsável iniciar atendimento mesmo quando userId e doctorId são diferentes', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 3,
      patientId: 10,
      status: 'scheduled',
    });
    appointmentsRepository.update.mockResolvedValue({
      id: 41,
      doctorId: 3,
      patientId: 10,
      status: 'in_progress',
    });

    await expect(
      service.update(41, { status: 'in_progress' }, doctorUser as never),
    ).resolves.toMatchObject({ status: 'in_progress' });

    expect(doctorsService.getOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 30 }),
    );
  });
});
