import { InternalServerErrorException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { hash } from 'bcrypt';
import { DoctorsService } from '../../src/doctors/doctors.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn<(...args: any[]) => any>(),
  hash: jest.fn<(...args: any[]) => any>(),
}));

jest.mock(
  'src/@common/entities/role.entity',
  () => ({
    ROLES: {
      ADMIN: 'admin',
      SECRETARY: 'secretary',
      DOCTOR: 'doctor',
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/roles/role.repository',
  () => ({
    RoleRepository: class RoleRepository {},
    ROLE_REPOSITORY: 'ROLE_REPOSITORY',
  }),
  { virtual: true },
);

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

jest.mock('../../src/doctors/doctors.repository', () => ({
  DoctorsRepository: class DoctorsRepository {},
}));

jest.mock('../../src/doctors/doctors-schedules.repository', () => ({
  DoctorSchedulesRepository: class DoctorSchedulesRepository {},
  DOCTOR_SCHEDULES_REPOSITORY: 'DOCTOR_SCHEDULES_REPOSITORY',
}));

describe(DoctorsService.name, () => {
  const doctorsRepository = {
    createWithUser: jest.fn<(...args: any[]) => any>(),
    find: jest.fn<(...args: any[]) => any>(),
    findOne: jest.fn<(...args: any[]) => any>(),
    findCalendar: jest.fn<(...args: any[]) => any>(),
  };
  const roleRepository = {
    findOne: jest.fn<(...args: any[]) => any>(),
    findByNames: jest.fn<(...args: any[]) => any>(),
  };
  const doctorSchedulesRepository = {
    replaceSchedules: jest.fn<(...args: any[]) => any>(),
    findByDoctorId: jest.fn<(...args: any[]) => any>(),
  };

  let service: DoctorsService;

  const validDoctorDto = {
    name: 'Helena Souza',
    email: 'helena@medclinic.com',
    password: 'SenhaForte@123',
    crm: 'CRM-SC-54321',
    phone: '47999990000',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DoctorsService(
      doctorsRepository as never,
      roleRepository as never,
      doctorSchedulesRepository as never,
    );
  });

  it('cria o médico junto com os dados do usuário e perfil doctor', async () => {
    const doctorRole = { id: 3, name: 'doctor' };
    const doctor = { id: 8, crm: validDoctorDto.crm };

    roleRepository.findOne.mockResolvedValue(doctorRole);
    jest.mocked(hash).mockResolvedValue('senha-hash');
    doctorsRepository.createWithUser.mockResolvedValue(doctor);

    await expect(service.create(validDoctorDto as never)).resolves.toBe(doctor);

    expect(roleRepository.findOne).toHaveBeenCalledWith('doctor');
    expect(hash).toHaveBeenCalledWith(validDoctorDto.password, 10);
    expect(doctorsRepository.createWithUser).toHaveBeenCalledWith(
      {
        name: validDoctorDto.name,
        email: validDoctorDto.email,
        password: 'senha-hash',
        roles: [doctorRole],
      },
      {
        crm: validDoctorDto.crm,
        phone: validDoctorDto.phone,
        contactEmail: validDoctorDto.email,
      },
    );
  });

  it('não tenta criar o usuário ou médico se o perfil doctor não estiver cadastrado', async () => {
    roleRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(validDoctorDto as never),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(hash).not.toHaveBeenCalled();
    expect(doctorsRepository.createWithUser).not.toHaveBeenCalled();
  });

  it('propaga falha da operação atômica do repositório', async () => {
    roleRepository.findOne.mockResolvedValue({ id: 3, name: 'doctor' });
    jest.mocked(hash).mockResolvedValue('senha-hash');
    const transactionError = new Error('Falha ao criar CRM duplicado');
    doctorsRepository.createWithUser.mockRejectedValue(transactionError);

    await expect(
      service.create(validDoctorDto as never),
    ).rejects.toBe(transactionError);
  });

  it('lista médicos com filtros e paginação recebidos', async () => {
    const query = { page: 2, pageSize: 10, name: 'Helena' };
    const doctors = [{ id: 8, crm: 'CRM-SC-54321' }];
    doctorsRepository.find.mockResolvedValue(doctors);

    await expect(service.getAll(query as never)).resolves.toBe(doctors);
    expect(doctorsRepository.find).toHaveBeenCalledWith(query);
  });

  it('consulta médico por id e solicita escalas somente quando pedido', async () => {
    const doctor = { id: 8, schedules: [] };
    doctorsRepository.findOne.mockResolvedValue(doctor);

    await expect(
      service.getOne({ id: 8, schedules: true }),
    ).resolves.toBe(doctor);

    expect(doctorsRepository.findOne).toHaveBeenCalledWith({
      id: 8,
      schedules: true,
    });
  });

  it('usa schedules false por padrão ao consultar um médico', async () => {
    const doctor = { id: 8 };
    doctorsRepository.findOne.mockResolvedValue(doctor);

    await service.getOne({ userId: 12 });

    expect(doctorsRepository.findOne).toHaveBeenCalledWith({
      userId: 12,
      schedules: false,
    });
  });

  it('retorna 404 quando o médico consultado não existe', async () => {
    doctorsRepository.findOne.mockResolvedValue(null);

    await expect(service.getOne({ id: 999 })).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });
  });

  it('aceita turnos encostados no mesmo dia da semana', async () => {
    const schedule = {
      shifts: [
        {
          weekDay: 1,
          startTime: '08:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
        },
        {
          weekDay: 1,
          startTime: '12:00',
          endTime: '18:00',
          slotDurationMinutes: 30,
        },
      ],
    };
    doctorSchedulesRepository.replaceSchedules.mockResolvedValue(schedule.shifts);

    await expect(service.postSchedule(8, schedule as never)).resolves.toEqual({
      shifts: schedule.shifts,
    });

    expect(doctorSchedulesRepository.replaceSchedules).toHaveBeenCalledWith(
      8,
      schedule,
    );
  });

  it('rejeita turnos sobrepostos no mesmo dia da semana com erro de dados inválidos', async () => {
    const schedule = {
      shifts: [
        {
          weekDay: 1,
          startTime: '08:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
        },
        {
          weekDay: 1,
          startTime: '11:30',
          endTime: '15:00',
          slotDurationMinutes: 30,
        },
      ],
    };

    await expect(
      service.postSchedule(8, schedule as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });

    expect(doctorSchedulesRepository.replaceSchedules).not.toHaveBeenCalled();
  });

  it('aceita turnos sobrepostos em dias diferentes', async () => {
    const schedule = {
      shifts: [
        {
          weekDay: 1,
          startTime: '08:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
        },
        {
          weekDay: 2,
          startTime: '08:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
        },
      ],
    };
    doctorSchedulesRepository.replaceSchedules.mockResolvedValue(schedule.shifts);

    await expect(service.postSchedule(8, schedule as never)).resolves.toEqual({
      shifts: schedule.shifts,
    });
  });

  it('valida os turnos após ordená-los sem rejeitar turnos não sobrepostos enviados fora de ordem', async () => {
    const schedule = {
      shifts: [
        {
          weekDay: 1,
          startTime: '14:00',
          endTime: '18:00',
          slotDurationMinutes: 30,
        },
        {
          weekDay: 1,
          startTime: '08:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
        },
      ],
    };
    doctorSchedulesRepository.replaceSchedules.mockResolvedValue(schedule.shifts);

    await expect(service.postSchedule(8, schedule as never)).resolves.toEqual({
      shifts: schedule.shifts,
    });
  });

  it('rejeita turno cujo início não é anterior ao término', async () => {
    const schedule = {
      shifts: [
        {
          weekDay: 1,
          startTime: '12:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
        },
      ],
    };

    await expect(
      service.postSchedule(8, schedule as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });

  it('rejeita turno menor que a duração de uma consulta', async () => {
    const schedule = {
      shifts: [
        {
          weekDay: 1,
          startTime: '08:00',
          endTime: '08:20',
          slotDurationMinutes: 30,
        },
      ],
    };

    await expect(
      service.postSchedule(8, schedule as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });

  it('aceita escala vazia para remover todos os turnos', async () => {
    doctorSchedulesRepository.replaceSchedules.mockResolvedValue([]);

    await expect(
      service.postSchedule(8, { shifts: [] } as never),
    ).resolves.toEqual({ shifts: [] });

    expect(doctorSchedulesRepository.replaceSchedules).toHaveBeenCalledWith(
      8,
      { shifts: [] },
    );
  });

  it('consulta a escala e devolve a lista de turnos', async () => {
    const shifts = [
      {
        weekDay: 1,
        startTime: '08:00',
        endTime: '12:00',
        slotDurationMinutes: 30,
      },
    ];
    doctorSchedulesRepository.findByDoctorId.mockResolvedValue(shifts);

    await expect(service.getSchedule(8)).resolves.toEqual({ shifts });
    expect(doctorSchedulesRepository.findByDoctorId).toHaveBeenCalledWith(8);
  });

  it('devolve escala e consultas da agenda do médico', async () => {
    const doctor = { id: 8 };
    const schedules = [{ weekDay: 1, startTime: '08:00', endTime: '12:00' }];
    const appointments = [{ id: 30, status: 'scheduled' }];
    doctorsRepository.findOne.mockResolvedValue(doctor);
    doctorsRepository.findCalendar.mockResolvedValue({
      schedules,
      appointments,
    });

    await expect(
      service.getCalendar(8, {
        from: '2026-11-02',
        to: '2026-11-06',
      } as never),
    ).resolves.toEqual({
      workSchedule: { shifts: schedules },
      appointments,
    });

    expect(doctorsRepository.findCalendar).toHaveBeenCalledWith(
      8,
      '2026-11-02',
      '2026-11-06',
    );
  });

  it('devolve arrays vazios quando médico existe mas consulta de agenda não retorna dados', async () => {
    doctorsRepository.findOne.mockResolvedValue({ id: 8 });
    doctorsRepository.findCalendar.mockResolvedValue(null);

    await expect(
      service.getCalendar(8, {
        from: '2026-11-02',
        to: '2026-11-06',
      } as never),
    ).resolves.toEqual({
      workSchedule: { shifts: [] },
      appointments: [],
    });
  });

  it('retorna 404 ao consultar agenda de médico inexistente', async () => {
    doctorsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getCalendar(999, {
        from: '2026-11-02',
        to: '2026-11-06',
      } as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    expect(doctorsRepository.findCalendar).not.toHaveBeenCalled();
  });
});
