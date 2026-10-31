import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AppointmentsService } from '../../src/appointments/appointments.service';
import { AppointmentsRepository } from '../../src/appointments/appointments.repository';
import { DoctorsService } from '../../src/doctors/doctors.service';
import { PatientsService } from '../../src/patients/patients.service';
import { DomainError, ERROR_CODE } from '../../src/@common/errors/domain.error';
import { ROLES } from '../../src/@common/entities/role.entity';
import { AuthUserDto } from '../../src/users/dto/auth-user.dto';
import { Appointment } from '../../src/@common/entities/appointment.entity';
import { CreateAppointmentDto } from '../../src/appointments/dto/create-appointment.dto';
import { FindAppointmentsDto } from '../../src/appointments/dto/find-appointments.dto';
import { getClinicLocalDateTime } from '../../src/appointments/appointment-period.rules';

const DAY_MS = 24 * 60 * 60 * 1_000;

function atClinicTime(hour: number, minute = 0): Date {
  const date = new Date(Date.now() + 10 * DAY_MS);
  // São Paulo is UTC-03:00; build an absolute instant for the clinic wall clock.
  date.setUTCHours(hour + 3, minute, 0, 0);
  return date;
}

function errorCode(error: unknown): string | undefined {
  if (!(error instanceof DomainError)) return undefined;
  const response = error.getResponse() as { code?: string };
  return response.code;
}

async function expectError(
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

describe(AppointmentsService.name, () => {
  const appointmentsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    hasDoctorConflict: jest.fn(),
    hasPatientConflict: jest.fn(),
    hasConflict: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };
  const doctorsService = { getOne: jest.fn() };
  const patientsService = { getOne: jest.fn() };

  let service: AppointmentsService;
  let startsAt: Date;
  let schedule: {
    weekDay: number;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
  };

  const patient = { id: 20 };
  const secretary: AuthUserDto = {
    sub: '90',
    data: { email: 'secretary@medclinic.com', roles: [ROLES.SECRETARY] },
  };
  const doctorUser: AuthUserDto = {
    sub: '3',
    data: { email: 'doctor@medclinic.com', roles: [ROLES.DOCTOR] },
  };
  const otherDoctor: AuthUserDto = {
    sub: '4',
    data: { email: 'other@medclinic.com', roles: [ROLES.DOCTOR] },
  };
  const admin: AuthUserDto = {
    sub: '1',
    data: { email: 'admin@medclinic.com', roles: [ROLES.ADMIN] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    startsAt = atClinicTime(8);
    schedule = {
      weekDay: getClinicLocalDateTime(startsAt).weekDay,
      startTime: '08:00',
      endTime: '12:00',
      slotDurationMinutes: 30,
    };
    service = new AppointmentsService(
      appointmentsRepository as unknown as AppointmentsRepository,
      doctorsService as unknown as DoctorsService,
      patientsService as unknown as PatientsService,
    );

    patientsService.getOne.mockResolvedValue(patient);
    doctorsService.getOne.mockResolvedValue({ id: 3, schedules: [schedule] });
    appointmentsRepository.hasDoctorConflict.mockResolvedValue(false);
    appointmentsRepository.hasPatientConflict.mockResolvedValue(false);
    appointmentsRepository.create.mockImplementation(
      async (data: Partial<Appointment>) => ({ id: 41, ...data }),
    );
    appointmentsRepository.find.mockResolvedValue([]);
    appointmentsRepository.update.mockImplementation(
      async (id: number, update: Partial<Appointment>) => ({
        id,
        doctorId: 3,
        patientId: 20,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60_000),
        status: 'scheduled',
        ...update,
      }),
    );
  });

  describe('create', () => {
    const dto = (): CreateAppointmentDto => ({
      doctorId: 3,
      patientId: 20,
      startsAt: startsAt.toISOString(),
    });

    it('creates an appointment and calculates endsAt using the shift duration', async () => {
      const result = await service.create(dto());

      expect(result.status).toBe('scheduled');
      expect(result.startsAt).toEqual(startsAt);
      expect(result.endsAt).toEqual(new Date(startsAt.getTime() + 30 * 60_000));
      expect(appointmentsRepository.hasDoctorConflict).toHaveBeenCalledWith(
        3,
        startsAt,
        new Date(startsAt.getTime() + 30 * 60_000),
      );
      expect(appointmentsRepository.hasPatientConflict).toHaveBeenCalledWith(
        20,
        startsAt,
        new Date(startsAt.getTime() + 30 * 60_000),
      );
      expect(appointmentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          doctorId: 3,
          patientId: 20,
          status: 'scheduled',
          notes: null,
        }),
      );
    });

    it('checks the patient before attempting to load the doctor', async () => {
      patientsService.getOne.mockRejectedValue(
        new DomainError('Paciente não encontrado.', ERROR_CODE.RECURSO_NAO_ENCONTRADO),
      );

      await expectError(service.create(dto()), ERROR_CODE.RECURSO_NAO_ENCONTRADO);
      expect(doctorsService.getOne).not.toHaveBeenCalled();
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('returns not found when the doctor does not exist', async () => {
      doctorsService.getOne.mockRejectedValue(
        new DomainError('Médico não encontrado.', ERROR_CODE.RECURSO_NAO_ENCONTRADO),
      );

      await expectError(service.create(dto()), ERROR_CODE.RECURSO_NAO_ENCONTRADO);
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects an invalid date', async () => {
      await expectError(
        service.create({ ...dto(), startsAt: 'invalid-date' }),
        ERROR_CODE.DADOS_INVALIDOS,
      );
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a date in the past', async () => {
      await expectError(
        service.create({ ...dto(), startsAt: '2020-01-01T11:00:00.000Z' }),
        ERROR_CODE.DADOS_INVALIDOS,
      );
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects an appointment outside every shift', async () => {
      const outsideShift = atClinicTime(13);
      await expectError(
        service.create({ ...dto(), startsAt: outsideShift.toISOString() }),
        ERROR_CODE.HORARIO_FORA_DA_ESCALA,
      );
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a start time that is not aligned to the shift grid', async () => {
      const unaligned = atClinicTime(8, 20);
      await expectError(
        service.create({ ...dto(), startsAt: unaligned.toISOString() }),
        ERROR_CODE.HORARIO_FORA_DA_ESCALA,
      );
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a consultation that does not fit entirely before shift end', async () => {
      schedule = { ...schedule, startTime: '08:00', endTime: '09:10' };
      const lateSlot = atClinicTime(9);
      await expectError(
        service.create({ ...dto(), startsAt: lateSlot.toISOString() }),
        ERROR_CODE.HORARIO_FORA_DA_ESCALA,
      );
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a shift with no slots', async () => {
      doctorsService.getOne.mockResolvedValue({ id: 3, schedules: [] });
      await expectError(service.create(dto()), ERROR_CODE.HORARIO_FORA_DA_ESCALA);
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects when an active appointment already occupies the doctor', async () => {
      appointmentsRepository.hasDoctorConflict.mockResolvedValue(true);
      await expectError(service.create(dto()), ERROR_CODE.HORARIO_INDISPONIVEL);
      expect(appointmentsRepository.hasPatientConflict).not.toHaveBeenCalled();
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects when the patient already has an active appointment', async () => {
      appointmentsRepository.hasPatientConflict.mockResolvedValue(true);
      await expectError(service.create(dto()), ERROR_CODE.PACIENTE_INDISPONIVEL);
      expect(appointmentsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('applies the requested filters and default pagination for an administrator', async () => {
      await service.getAll(
        {
          doctorId: 3,
          patientId: 20,
          status: 'scheduled',
          from: '2026-11-02',
          to: '2026-11-03',
        } as FindAppointmentsDto,
        admin,
      );

      expect(appointmentsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          doctorId: 3,
          patientId: 20,
          status: 'scheduled',
          page: 1,
          pageSize: 10,
          from: new Date('2026-11-02T00:00:00.000Z'),
          to: new Date('2026-11-03T00:00:00.000Z'),
        }),
      );
    });

    it('forces a doctor to see only their own appointments', async () => {
      await service.getAll({ doctorId: 999, page: 2, pageSize: 5 }, doctorUser);

      expect(doctorsService.getOne).toHaveBeenCalledWith({
        id: 3,
        schedules: false,
      });
      expect(appointmentsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ doctorId: 3, page: 2, pageSize: 5 }),
      );
    });

    it('does not override the doctor filter for users with both doctor and admin roles', async () => {
      const combinedUser: AuthUserDto = {
        sub: '3',
        data: { email: 'admin-doctor@medclinic.com', roles: [ROLES.DOCTOR, ROLES.ADMIN] },
      };
      await service.getAll({ doctorId: 8 }, combinedUser);

      expect(doctorsService.getOne).not.toHaveBeenCalled();
      expect(appointmentsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ doctorId: 8 }),
      );
    });
  });

  describe('getById', () => {
    it('returns not found when the appointment does not exist', async () => {
      appointmentsRepository.findById.mockResolvedValue(null);
      await expectError(service.getById(999, admin), ERROR_CODE.RECURSO_NAO_ENCONTRADO);
    });

    it('denies a doctor access to another doctor appointment', async () => {
      appointmentsRepository.findById.mockResolvedValue({
        id: 41,
        doctorId: 8,
        patientId: 20,
      });
      await expectError(service.getById(41, doctorUser), ERROR_CODE.ACESSO_NEGADO);
    });

    it('allows the assigned doctor and the administrator', async () => {
      const appointment = { id: 41, doctorId: 3, patientId: 20 };
      appointmentsRepository.findById.mockResolvedValue(appointment);

      await expect(service.getById(41, doctorUser)).resolves.toBe(appointment);
      await expect(service.getById(41, admin)).resolves.toBe(appointment);
    });
  });

  describe('update status', () => {
    function existing(status: Appointment['status']): Appointment {
      return {
        id: 41,
        doctorId: 3,
        patientId: 20,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60_000),
        status,
      } as Appointment;
    }

    beforeEach(() => {
      appointmentsRepository.findById.mockImplementation(async () => existing('scheduled'));
    });

    it('allows the assigned doctor to start a scheduled consultation', async () => {
      await service.update(41, { status: 'in_progress' }, doctorUser);
      expect(appointmentsRepository.update).toHaveBeenCalledWith(41, {
        status: 'in_progress',
      });
    });

    it('allows an administrator to start a scheduled consultation', async () => {
      await service.update(41, { status: 'in_progress' }, admin);
      expect(appointmentsRepository.update).toHaveBeenCalledWith(41, {
        status: 'in_progress',
      });
    });

    it('allows the secretary to cancel a scheduled consultation', async () => {
      await service.update(41, { status: 'cancelled' }, secretary);
      expect(appointmentsRepository.update).toHaveBeenCalledWith(41, {
        status: 'cancelled',
      });
    });

    it('denies the secretary permission to start a consultation', async () => {
      await expectError(
        service.update(41, { status: 'in_progress' }, secretary),
        ERROR_CODE.ACESSO_NEGADO,
      );
    });

    it('denies a different doctor permission to change the consultation status', async () => {
      await expectError(
        service.update(41, { status: 'in_progress' }, otherDoctor),
        ERROR_CODE.ACESSO_NEGADO,
      );
    });

    it('rejects an unknown status as invalid input', async () => {
      await expectError(
        service.update(41, { status: 'unknown' as Appointment['status'] }, admin),
        ERROR_CODE.DADOS_INVALIDOS,
      );
    });

    it('rejects an omitted status as invalid input', async () => {
      await expectError(service.update(41, {}, admin), ERROR_CODE.DADOS_INVALIDOS);
    });

    it('rejects a transition from scheduled directly to done', async () => {
      await expectError(
        service.update(41, { status: 'done' }, admin),
        ERROR_CODE.TRANSICAO_INVALIDA,
      );
    });

    it('allows the assigned doctor to complete an in-progress consultation', async () => {
      appointmentsRepository.findById.mockResolvedValue(existing('in_progress'));
      await service.update(41, { status: 'done' }, doctorUser);
      expect(appointmentsRepository.update).toHaveBeenCalledWith(41, { status: 'done' });
    });

    it('allows the administrator to cancel an in-progress consultation', async () => {
      appointmentsRepository.findById.mockResolvedValue(existing('in_progress'));
      await service.update(41, { status: 'cancelled' }, admin);
      expect(appointmentsRepository.update).toHaveBeenCalledWith(41, {
        status: 'cancelled',
      });
    });

    it('denies the secretary permission to cancel an in-progress consultation', async () => {
      appointmentsRepository.findById.mockResolvedValue(existing('in_progress'));
      await expectError(
        service.update(41, { status: 'cancelled' }, secretary),
        ERROR_CODE.ACESSO_NEGADO,
      );
    });

    it('does not allow a completed consultation to change state', async () => {
      appointmentsRepository.findById.mockResolvedValue(existing('done'));
      await expectError(
        service.update(41, { status: 'cancelled' }, admin),
        ERROR_CODE.TRANSICAO_INVALIDA,
      );
    });

    it('does not allow a cancelled consultation to change state', async () => {
      appointmentsRepository.findById.mockResolvedValue(existing('cancelled'));
      await expectError(
        service.update(41, { status: 'scheduled' }, admin),
        ERROR_CODE.TRANSICAO_INVALIDA,
      );
    });
  });
});
