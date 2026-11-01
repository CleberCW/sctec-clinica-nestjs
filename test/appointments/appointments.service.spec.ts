import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
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
    ROLES: {
      ADMIN: 'admin',
      SECRETARY: 'secretary',
      DOCTOR: 'doctor',
    },
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

describe(AppointmentsService.name, () => {
  const appointmentsRepository = {
    create: jest.fn<(...args: any[]) => any>(),
    findById: jest.fn<(...args: any[]) => any>(),
    hasPatientConflict: jest.fn<(...args: any[]) => any>(),
    hasConflict: jest.fn<(...args: any[]) => any>(),
    find: jest.fn<(...args: any[]) => any>(),
    update: jest.fn<(...args: any[]) => any>(),
  };
  const doctorsService = {
    getOne: jest.fn<(...args: any[]) => any>(),
  };
  const patientsService = {
    getOne: jest.fn<(...args: any[]) => any>(),
  };

  let service: AppointmentsService;

  const doctor = {
    id: 3,
    userId: 30,
    schedules: [
      {
        weekDay: 1,
        startTime: '08:00',
        endTime: '12:00',
        slotDurationMinutes: 30,
      },
    ],
  };
  const patient = {
    id: 10,
    appointments: [],
  };
  const secretary = {
    sub: '90',
    data: { email: 'secretaria@medclinic.com', roles: ['secretary'] },
  };
  const admin = {
    sub: '1',
    data: { email: 'admin@medclinic.com', roles: ['admin'] },
  };
  const doctorUser = {
    sub: '30',
    data: { email: 'medico@medclinic.com', roles: ['doctor'] },
  };

  const validDto = {
    doctorId: 3,
    patientId: 10,
    startsAt: '2026-11-02T11:00:00.000Z',
    notes: 'Consulta de rotina',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-01T00:00:00.000Z'));

    service = new AppointmentsService(
      appointmentsRepository as never,
      doctorsService as never,
      patientsService as never,
    );

    patientsService.getOne.mockResolvedValue(patient);
    doctorsService.getOne.mockResolvedValue(doctor);
    appointmentsRepository.hasPatientConflict.mockResolvedValue(false);
    appointmentsRepository.create.mockImplementation(async (value) => ({
      id: 41,
      ...value,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cria agendamento calculando o fim e persistindo instantes em UTC', async () => {
    const result = await service.create(validDto as never);

    expect(patientsService.getOne).toHaveBeenCalledWith(10);
    expect(doctorsService.getOne).toHaveBeenCalledWith({
      id: 3,
      schedules: true,
    });
    expect(appointmentsRepository.hasPatientConflict).toHaveBeenCalledWith(
      10,
      new Date('2026-11-02T11:00:00.000Z'),
      new Date('2026-11-02T11:30:00.000Z'),
    );
    expect(appointmentsRepository.create).toHaveBeenCalledWith({
      doctorId: 3,
      patientId: 10,
      startsAt: new Date('2026-11-02T11:00:00.000Z'),
      endsAt: new Date('2026-11-02T11:30:00.000Z'),
      notes: 'Consulta de rotina',
      status: 'scheduled',
    });
    expect(result.startsAt.toISOString()).toBe('2026-11-02T11:00:00.000Z');
    expect(result.endsAt.toISOString()).toBe('2026-11-02T11:30:00.000Z');
  });

  it('converte o instante UTC para o dia e horário de relógio de São Paulo antes de validar a escala', async () => {
    // 2026-11-02 11:00 UTC corresponde a segunda-feira, 08:00 em São Paulo.
    const result = await service.create({
      ...validDto,
      startsAt: '2026-11-02T11:00:00Z',
    } as never);

    expect(result.endsAt.toISOString()).toBe('2026-11-02T11:30:00.000Z');
  });

  it('considera o dia anterior em São Paulo quando o instante UTC ainda é antes da meia-noite local', async () => {
    doctorsService.getOne.mockResolvedValue({
      ...doctor,
      schedules: [
        {
          weekDay: 0,
          startTime: '22:00',
          endTime: '23:59',
          slotDurationMinutes: 30,
        },
      ],
    });

    await expect(
      service.create({
        ...validDto,
        startsAt: '2026-11-02T02:00:00Z', // domingo, 23:00 local
      } as never),
    ).resolves.toBeDefined();
  });

  it('alinha a grade a partir do início do turno, não da meia-noite', async () => {
    doctorsService.getOne.mockResolvedValue({
      ...doctor,
      schedules: [
        {
          weekDay: 1,
          startTime: '08:10',
          endTime: '12:10',
          slotDurationMinutes: 30,
        },
      ],
    });

    await expect(
      service.create({
        ...validDto,
        startsAt: '2026-11-02T11:10:00Z', // 08:10 local
      } as never),
    ).resolves.toBeDefined();
  });

  it('rejeita horário fora de qualquer turno com HORARIO_FORA_DA_ESCALA', async () => {
    await expect(
      service.create({
        ...validDto,
        startsAt: '2026-11-02T10:00:00Z', // 07:00 local
      } as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 422,
        code: 'HORARIO_FORA_DA_ESCALA',
      },
    });

    expect(appointmentsRepository.create).not.toHaveBeenCalled();
  });

  it('rejeita horário desalinhado da grade do turno', async () => {
    await expect(
      service.create({
        ...validDto,
        startsAt: '2026-11-02T11:20:00Z', // 08:20 local, grade de 30 min
      } as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 422,
        code: 'HORARIO_FORA_DA_ESCALA',
      },
    });
  });

  it('rejeita consulta que não cabe integralmente no fim do turno', async () => {
    doctorsService.getOne.mockResolvedValue({
      ...doctor,
      schedules: [
        {
          weekDay: 1,
          startTime: '08:00',
          endTime: '11:50',
          slotDurationMinutes: 30,
        },
      ],
    });

    await expect(
      service.create({
        ...validDto,
        startsAt: '2026-11-02T14:30:00Z', // 11:30 local; fim previsto 12:00
      } as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 422,
        code: 'HORARIO_FORA_DA_ESCALA',
      },
    });
  });

  it('rejeita instante inválido', async () => {
    await expect(
      service.create({
        ...validDto,
        startsAt: 'data-invalida',
      } as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });

  it('rejeita agendamento no passado', async () => {
    await expect(
      service.create({
        ...validDto,
        startsAt: '2026-10-31T11:00:00Z',
      } as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });

  it('rejeita quando não existe escala cadastrada', async () => {
    doctorsService.getOne.mockResolvedValue({ ...doctor, schedules: [] });

    await expect(service.create(validDto as never)).rejects.toMatchObject({
      response: {
        statusCode: 422,
        code: 'HORARIO_FORA_DA_ESCALA',
      },
    });
  });

  it('retorna 404 antes de procurar médico quando o paciente não existe', async () => {
    patientsService.getOne.mockRejectedValue({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    await expect(service.create(validDto as never)).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    expect(doctorsService.getOne).not.toHaveBeenCalled();
  });

  it('propaga 404 quando o médico não existe', async () => {
    doctorsService.getOne.mockRejectedValue({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });

    await expect(service.create(validDto as never)).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });
  });

  it('rejeita conflito com outro agendamento ativo do paciente', async () => {
    appointmentsRepository.hasPatientConflict.mockResolvedValue(true);

    await expect(service.create(validDto as never)).rejects.toMatchObject({
      response: {
        statusCode: 409,
        code: 'PACIENTE_INDISPONIVEL',
      },
    });

    expect(appointmentsRepository.create).not.toHaveBeenCalled();
  });

  it('propaga conflito do médico sinalizado pela restrição de exclusão do banco', async () => {
    appointmentsRepository.create.mockRejectedValue({
      response: {
        statusCode: 409,
        code: 'HORARIO_INDISPONIVEL',
      },
    });

    await expect(service.create(validDto as never)).rejects.toMatchObject({
      response: {
        statusCode: 409,
        code: 'HORARIO_INDISPONIVEL',
      },
    });
  });

  it('envia notas nulas quando não são informadas', async () => {
    await service.create({ ...validDto, notes: undefined } as never);

    expect(appointmentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });

  it('lista consultas com filtros, intervalo UTC e paginação', async () => {
    const appointments = [{ id: 41, doctorId: 3 }];
    appointmentsRepository.find.mockResolvedValue(appointments);

    await expect(
      service.getAll(
        {
          doctorId: 3,
          patientId: 10,
          status: 'scheduled',
          from: '2026-11-02',
          to: '2026-11-10',
          page: 2,
          pageSize: 15,
        } as never,
        admin as never,
      ),
    ).resolves.toBe(appointments);

    expect(appointmentsRepository.find).toHaveBeenCalledWith({
      doctorId: 3,
      patientId: 10,
      status: 'scheduled',
      from: new Date('2026-11-02T00:00:00.000Z'),
      to: new Date('2026-11-10T00:00:00.000Z'),
      page: 2,
      pageSize: 15,
    });
  });

  it('força médico a consultar somente seus próprios agendamentos', async () => {
    const appointments = [{ id: 41, doctorId: 3 }];
    doctorsService.getOne.mockResolvedValue({ id: 3, userId: 30 });
    appointmentsRepository.find.mockResolvedValue(appointments);

    await service.getAll(
      { doctorId: 999, page: 1, pageSize: 10 } as never,
      doctorUser as never,
    );

    expect(doctorsService.getOne).toHaveBeenCalledWith({
      userId: 30,
      schedules: false,
    });
    expect(appointmentsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ doctorId: 3 }),
    );
  });

  it('permite que admin consulte agendamentos de qualquer médico', async () => {
    appointmentsRepository.find.mockResolvedValue([]);

    await service.getAll(
      { doctorId: 999 } as never,
      admin as never,
    );

    expect(doctorsService.getOne).not.toHaveBeenCalled();
    expect(appointmentsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ doctorId: 999 }),
    );
  });

  it('retorna 404 ao consultar agendamentos de médico inexistente no vínculo do usuário', async () => {
    doctorsService.getOne.mockRejectedValue({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });

    await expect(
      service.getAll({} as never, doctorUser as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });

    expect(appointmentsRepository.find).not.toHaveBeenCalled();
  });

  it('retorna agendamento existente para usuário autenticado', async () => {
    const appointment = {
      id: 41,
      doctorId: 30,
      patientId: 10,
      status: 'scheduled',
    };
    appointmentsRepository.findById.mockResolvedValue(appointment);

    await expect(
      service.getById(41, doctorUser as never),
    ).resolves.toBe(appointment);
  });

  it('retorna 404 ao consultar agendamento inexistente', async () => {
    appointmentsRepository.findById.mockResolvedValue(null);

    await expect(
      service.getById(999, admin as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 404,
        code: 'RECURSO_NAO_ENCONTRADO',
      },
    });
  });

  it('impede médico de consultar agenda de outro médico', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 99,
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

  it('permite admin consultar agendamento de outro médico', async () => {
    const appointment = { id: 41, doctorId: 99, status: 'scheduled' };
    appointmentsRepository.findById.mockResolvedValue(appointment);

    await expect(
      service.getById(41, admin as never),
    ).resolves.toBe(appointment);
  });

  it('médico responsável inicia consulta agendada', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'scheduled',
    });
    appointmentsRepository.update.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'in_progress',
    });

    await expect(
      service.update(41, { status: 'in_progress' }, doctorUser as never),
    ).resolves.toMatchObject({ status: 'in_progress' });

    expect(appointmentsRepository.update).toHaveBeenCalledWith(41, {
      status: 'in_progress',
    });
  });

  it('admin pode iniciar uma consulta agendada', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 99,
      status: 'scheduled',
    });
    appointmentsRepository.update.mockResolvedValue({
      id: 41,
      status: 'in_progress',
    });

    await expect(
      service.update(41, { status: 'in_progress' }, admin as never),
    ).resolves.toMatchObject({ status: 'in_progress' });
  });

  it('secretaria pode cancelar consulta agendada', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 99,
      status: 'scheduled',
    });
    appointmentsRepository.update.mockResolvedValue({
      id: 41,
      status: 'cancelled',
    });

    await expect(
      service.update(41, { status: 'cancelled' }, secretary as never),
    ).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('secretaria não pode cancelar consulta em andamento', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 99,
      status: 'in_progress',
    });

    await expect(
      service.update(41, { status: 'cancelled' }, secretary as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });
  });

  it('médico responsável pode concluir consulta em andamento', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'in_progress',
    });
    appointmentsRepository.update.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'done',
    });

    await expect(
      service.update(41, { status: 'done' }, doctorUser as never),
    ).resolves.toMatchObject({ status: 'done' });
  });

  it('admin pode cancelar consulta em andamento', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 99,
      status: 'in_progress',
    });
    appointmentsRepository.update.mockResolvedValue({
      id: 41,
      status: 'cancelled',
    });

    await expect(
      service.update(41, { status: 'cancelled' }, admin as never),
    ).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('médico responsável pode cancelar consulta em andamento', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'in_progress',
    });
    appointmentsRepository.update.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'cancelled',
    });

    await expect(
      service.update(41, { status: 'cancelled' }, doctorUser as never),
    ).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('recusa início de consulta por secretaria', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'scheduled',
    });

    await expect(
      service.update(41, { status: 'in_progress' }, secretary as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'ACESSO_NEGADO',
      },
    });
  });

  it('recusa transição inválida de scheduled diretamente para done', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'scheduled',
    });

    await expect(
      service.update(41, { status: 'done' }, doctorUser as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 422,
        code: 'TRANSICAO_INVALIDA',
      },
    });
  });

  it('não permite alterar consulta concluída', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'done',
    });

    await expect(
      service.update(41, { status: 'cancelled' }, admin as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 422,
        code: 'TRANSICAO_INVALIDA',
      },
    });
  });

  it('não permite alterar consulta cancelada', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'cancelled',
    });

    await expect(
      service.update(41, { status: 'scheduled' }, admin as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 422,
        code: 'TRANSICAO_INVALIDA',
      },
    });
  });

  it('rejeita status fora do enum como dados inválidos', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'scheduled',
    });

    await expect(
      service.update(41, { status: 'finished' as never }, admin as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });

  it('rejeita atualização sem novo status', async () => {
    appointmentsRepository.findById.mockResolvedValue({
      id: 41,
      doctorId: 30,
      status: 'scheduled',
    });

    await expect(
      service.update(41, {} as never, admin as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: 400,
        code: 'DADOS_INVALIDOS',
      },
    });
  });
});
