import { beforeEach, describe, expect, it, jest } from '@jest/globals';
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

type IntervalCase = {
  description: string;
  existingStartsAt: string;
  existingEndsAt: string;
  requestedStartsAt: string;
  requestedEndsAt: string;
  expectedConflict: boolean;
};

const cases: IntervalCase[] = [
  {
    description: 'período existente termina antes do solicitado',
    existingStartsAt: '2026-11-02T08:00:00.000Z',
    existingEndsAt: '2026-11-02T08:30:00.000Z',
    requestedStartsAt: '2026-11-02T09:00:00.000Z',
    requestedEndsAt: '2026-11-02T09:30:00.000Z',
    expectedConflict: false,
  },
  {
    description: 'período existente começa depois do solicitado',
    existingStartsAt: '2026-11-02T10:00:00.000Z',
    existingEndsAt: '2026-11-02T10:30:00.000Z',
    requestedStartsAt: '2026-11-02T09:00:00.000Z',
    requestedEndsAt: '2026-11-02T09:30:00.000Z',
    expectedConflict: false,
  },
  {
    description: 'períodos encostados não se sobrepõem',
    existingStartsAt: '2026-11-02T09:00:00.000Z',
    existingEndsAt: '2026-11-02T09:30:00.000Z',
    requestedStartsAt: '2026-11-02T09:30:00.000Z',
    requestedEndsAt: '2026-11-02T10:00:00.000Z',
    expectedConflict: false,
  },
  {
    description: 'período solicitado está inteiramente dentro do existente',
    existingStartsAt: '2026-11-02T08:00:00.000Z',
    existingEndsAt: '2026-11-02T11:00:00.000Z',
    requestedStartsAt: '2026-11-02T09:00:00.000Z',
    requestedEndsAt: '2026-11-02T10:00:00.000Z',
    expectedConflict: true,
  },
  {
    description: 'períodos cruzam a borda e têm interseção parcial',
    existingStartsAt: '2026-11-02T08:45:00.000Z',
    existingEndsAt: '2026-11-02T09:15:00.000Z',
    requestedStartsAt: '2026-11-02T09:00:00.000Z',
    requestedEndsAt: '2026-11-02T09:30:00.000Z',
    expectedConflict: true,
  },
];

describe('AppointmentsTypeORMRepository.hasPatientConflict', () => {
  let existingAppointment: {
    patientId: number;
    status: string;
    startsAt: Date;
    endsAt: Date;
  };

  const queryBuilder = {
    where: jest.fn(),
    andWhere: jest.fn(),
    getCount: jest.fn(),
  };
  const typeormRepository = {
    createQueryBuilder: jest.fn(),
  };
  const dataSource = {
    getRepository: jest.fn(),
  };

  let repository: AppointmentsTypeORMRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new AppointmentsTypeORMRepository(dataSource as never);

    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    typeormRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    dataSource.getRepository.mockReturnValue(typeormRepository);

    queryBuilder.getCount.mockImplementation(() => {
      const whereCalls = queryBuilder.where.mock.calls;
      const andWhereCalls = queryBuilder.andWhere.mock.calls;
      const parameters = Object.assign(
        {},
        ...whereCalls.map(([, values]) => values ?? {}),
        ...andWhereCalls.map(([, values]) => values ?? {}),
      ) as {
        startsAt: Date;
        endsAt: Date;
        patientId: number;
        cancelled: string;
      };

      const overlaps =
        existingAppointment.startsAt.getTime() <
          new Date(parameters.endsAt).getTime() &&
        existingAppointment.endsAt.getTime() >
          new Date(parameters.startsAt).getTime();

      const isSamePatient =
        existingAppointment.patientId === parameters.patientId;
      const isActive = existingAppointment.status !== parameters.cancelled;

      return Promise.resolve(
        overlaps && isSamePatient && isActive ? 1 : 0,
      );
    });
  });

  it.each(cases)('$description', async (scenario) => {
    existingAppointment = {
      patientId: 10,
      status: 'scheduled',
      startsAt: new Date(scenario.existingStartsAt),
      endsAt: new Date(scenario.existingEndsAt),
    };

    await expect(
      repository.hasPatientConflict(
        10,
        new Date(scenario.requestedStartsAt),
        new Date(scenario.requestedEndsAt),
      ),
    ).resolves.toBe(scenario.expectedConflict);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'appointment.startsAt < :endsAt',
      { endsAt: new Date(scenario.requestedEndsAt) },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'appointment.endsAt > :startsAt',
      { startsAt: new Date(scenario.requestedStartsAt) },
    );
  });

  it('não considera consulta cancelada como conflito', async () => {
    existingAppointment = {
      patientId: 10,
      status: 'cancelled',
      startsAt: new Date('2026-11-02T09:00:00.000Z'),
      endsAt: new Date('2026-11-02T10:00:00.000Z'),
    };

    await expect(
      repository.hasPatientConflict(
        10,
        new Date('2026-11-02T09:15:00.000Z'),
        new Date('2026-11-02T09:45:00.000Z'),
      ),
    ).resolves.toBe(false);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'appointment.status != :cancelled',
      { cancelled: 'cancelled' },
    );
  });

  it('não considera consultas de outro paciente como conflito', async () => {
    existingAppointment = {
      patientId: 99,
      status: 'scheduled',
      startsAt: new Date('2026-11-02T09:00:00.000Z'),
      endsAt: new Date('2026-11-02T10:00:00.000Z'),
    };

    await expect(
      repository.hasPatientConflict(
        10,
        new Date('2026-11-02T09:15:00.000Z'),
        new Date('2026-11-02T09:45:00.000Z'),
      ),
    ).resolves.toBe(false);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'appointment.patientId = :patientId',
      { patientId: 10 },
    );
  });
});
