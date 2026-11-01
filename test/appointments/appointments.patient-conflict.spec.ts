import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
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

type QueryParameters = Record<string, Date | string | number>;

type QueryBuilderStub = {
  where: Mock<
    (sql: string, parameters?: QueryParameters) => QueryBuilderStub
  >;
  andWhere: Mock<
    (sql: string, parameters?: QueryParameters) => QueryBuilderStub
  >;
  getCount: Mock<() => Promise<number>>;
};

type ExistingAppointment = {
  patientId: number;
  status: string;
  startsAt: Date;
  endsAt: Date;
};

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
  let existingAppointment: ExistingAppointment;
  let requestedStartsAt: Date | undefined;
  let requestedEndsAt: Date | undefined;
  let requestedPatientId: number | undefined;

  const queryBuilder: QueryBuilderStub = {
    where: jest.fn<
      (sql: string, parameters?: QueryParameters) => QueryBuilderStub
    >(),
    andWhere: jest.fn<
      (sql: string, parameters?: QueryParameters) => QueryBuilderStub
    >(),
    getCount: jest.fn<() => Promise<number>>(),
  };
  const typeormRepository = {
    createQueryBuilder: jest.fn<(_alias: string) => QueryBuilderStub>(),
  };
  const dataSource = {
    getRepository: jest.fn<() => typeof typeormRepository>(),
  };

  let repository: AppointmentsTypeORMRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    requestedStartsAt = undefined;
    requestedEndsAt = undefined;
    requestedPatientId = undefined;

    repository = new AppointmentsTypeORMRepository(dataSource as never);

    queryBuilder.where.mockImplementation((_sql, parameters) => {
      if (parameters?.endsAt instanceof Date) {
        requestedEndsAt = parameters.endsAt;
      }
      return queryBuilder;
    });
    queryBuilder.andWhere.mockImplementation((sql, parameters) => {
      if (sql === 'appointment.endsAt > :startsAt' && parameters?.startsAt instanceof Date) {
        requestedStartsAt = parameters.startsAt;
      }
      if (
        sql === 'appointment.patientId = :patientId' &&
        typeof parameters?.patientId === 'number'
      ) {
        requestedPatientId = parameters.patientId;
      }
      return queryBuilder;
    });
    queryBuilder.getCount.mockImplementation(() => {
      if (!requestedStartsAt || !requestedEndsAt || requestedPatientId === undefined) {
        throw new Error('Parâmetros de conflito não foram capturados.');
      }

      const overlaps =
        existingAppointment.startsAt.getTime() < requestedEndsAt.getTime() &&
        existingAppointment.endsAt.getTime() > requestedStartsAt.getTime();
      const isSamePatient =
        existingAppointment.patientId === requestedPatientId;
      const isActive = existingAppointment.status !== 'cancelled';

      return Promise.resolve(overlaps && isSamePatient && isActive ? 1 : 0);
    });

    typeormRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    dataSource.getRepository.mockReturnValue(typeormRepository);
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
