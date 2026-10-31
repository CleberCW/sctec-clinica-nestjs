import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InternalServerErrorException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { DoctorsService } from '../../src/doctors/doctors.service';
import { DoctorsRepository } from '../../src/doctors/doctors.repository';
import { RoleRepository } from '../../src/roles/role.repository';
import { DoctorSchedulesRepository } from '../../src/doctors/doctors-schedules.repository';
import { ROLES, Role } from '../../src/@common/entities/role.entity';
import { DomainError, ERROR_CODE } from '../../src/@common/errors/domain.error';
import { CreateDoctorSchedulesDto } from '../../src/doctors/dto/create-doctor-schedule.dto';
import { CreateDoctorDto } from '../../src/doctors/dto/create-doctor.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

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

describe(DoctorsService.name, () => {
  const doctorsRepository = {
    createWithUser: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const roleRepository = { findOne: jest.fn() };
  const schedulesRepository = {
    replaceSchedules: jest.fn(),
    findByDoctorId: jest.fn(),
  };

  let service: DoctorsService;
  const doctorRole = { id: 3, name: ROLES.DOCTOR } as Role;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DoctorsService(
      doctorsRepository as unknown as DoctorsRepository,
      roleRepository as unknown as RoleRepository,
      schedulesRepository as unknown as DoctorSchedulesRepository,
    );
    roleRepository.findOne.mockResolvedValue(doctorRole);
    (hash as jest.Mock).mockResolvedValue('bcrypt-hash');
    doctorsRepository.createWithUser.mockResolvedValue({ id: 5, crm: 'CRM-SC-123' });
    doctorsRepository.find.mockResolvedValue([]);
    doctorsRepository.findOne.mockResolvedValue({ id: 5 });
    schedulesRepository.replaceSchedules.mockImplementation(
      async (_id: number, dto: CreateDoctorSchedulesDto) => dto.shifts,
    );
    schedulesRepository.findByDoctorId.mockResolvedValue([]);
  });

  describe('create', () => {
    const dto: CreateDoctorDto = {
      name: 'Dra. Helena Souza',
      email: 'helena@medclinic.com',
      password: 'SenhaForte@123',
      crm: 'CRM-SC-123',
      phone: '47999999999',
    };

    it('creates the user and doctor together through the repository port', async () => {
      await expect(service.create(dto)).resolves.toEqual({ id: 5, crm: 'CRM-SC-123' });

      expect(roleRepository.findOne).toHaveBeenCalledWith(ROLES.DOCTOR);
      expect(hash).toHaveBeenCalledWith(dto.password, 10);
      expect(doctorsRepository.createWithUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          email: dto.email,
          password: 'bcrypt-hash',
          roles: [doctorRole],
        }),
        expect.objectContaining({
          crm: dto.crm,
          phone: dto.phone,
          contactEmail: dto.email,
        }),
      );
    });

    it('fails without creating a doctor when the doctor role is missing', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(hash).not.toHaveBeenCalled();
      expect(doctorsRepository.createWithUser).not.toHaveBeenCalled();
    });
  });

  it('delegates doctor listing to the repository', async () => {
    const query = { page: 2, pageSize: 15, name: 'Helena' };
    await service.getAll(query);
    expect(doctorsRepository.find).toHaveBeenCalledWith(query);
  });

  describe('getOne', () => {
    it('loads a doctor with schedules when requested', async () => {
      const doctor = { id: 5, schedules: [] };
      doctorsRepository.findOne.mockResolvedValue(doctor);

      await expect(service.getOne({ id: 5, schedules: true })).resolves.toBe(doctor);
      expect(doctorsRepository.findOne).toHaveBeenCalledWith({
        id: 5,
        schedules: true,
      });
    });

    it('defaults schedules to false', async () => {
      await service.getOne({ userId: 9 });
      expect(doctorsRepository.findOne).toHaveBeenCalledWith({
        userId: 9,
        schedules: false,
      });
    });

    it('returns not found when no doctor matches', async () => {
      doctorsRepository.findOne.mockResolvedValue(null);
      await expectDomainError(
        service.getOne({ id: 404 }),
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    });
  });

  describe('postSchedule', () => {
    it('rejects overlapping shifts on the same weekday', async () => {
      const dto: CreateDoctorSchedulesDto = {
        shifts: [
          { weekDay: 2, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 },
          { weekDay: 2, startTime: '11:30', endTime: '14:00', slotDurationMinutes: 30 },
        ],
      };

      await expectDomainError(
        service.postSchedule(5, dto),
        ERROR_CODE.DADOS_INVALIDOS,
      );
      expect(schedulesRepository.replaceSchedules).not.toHaveBeenCalled();
    });

    it('accepts shifts that touch exactly at the boundary', async () => {
      const dto: CreateDoctorSchedulesDto = {
        shifts: [
          { weekDay: 2, startTime: '12:00', endTime: '18:00', slotDurationMinutes: 30 },
          { weekDay: 2, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 },
        ],
      };

      const result = await service.postSchedule(5, dto);

      expect(result.shifts).toHaveLength(2);
      expect(dto.shifts[0].startTime).toBe('08:00');
      expect(schedulesRepository.replaceSchedules).toHaveBeenCalledWith(5, dto);
    });

    it('allows shifts on different weekdays to have different times', async () => {
      const dto: CreateDoctorSchedulesDto = {
        shifts: [
          { weekDay: 3, startTime: '14:00', endTime: '18:00', slotDurationMinutes: 30 },
          { weekDay: 1, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 },
        ],
      };

      await expect(service.postSchedule(5, dto)).resolves.toBeDefined();
      expect(schedulesRepository.replaceSchedules).toHaveBeenCalled();
    });

    it('rejects a shift whose start is not before its end', async () => {
      const dto: CreateDoctorSchedulesDto = {
        shifts: [
          { weekDay: 2, startTime: '12:00', endTime: '12:00', slotDurationMinutes: 30 },
        ],
      };

      await expectDomainError(
        service.postSchedule(5, dto),
        ERROR_CODE.DADOS_INVALIDOS,
      );
    });

    it('rejects a shift shorter than one appointment slot', async () => {
      const dto: CreateDoctorSchedulesDto = {
        shifts: [
          { weekDay: 2, startTime: '08:00', endTime: '08:20', slotDurationMinutes: 30 },
        ],
      };

      await expectDomainError(
        service.postSchedule(5, dto),
        ERROR_CODE.DADOS_INVALIDOS,
      );
    });
  });

  it('returns an empty shift list when the doctor has no registered schedule', async () => {
    await expect(service.getSchedule(5)).resolves.toEqual({ shifts: [] });
    expect(schedulesRepository.findByDoctorId).toHaveBeenCalledWith(5);
  });
});
