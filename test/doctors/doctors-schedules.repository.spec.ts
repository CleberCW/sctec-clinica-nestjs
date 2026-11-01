import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DoctorSchedulesTypeORMRepository } from '../../src/doctors/doctors-schedules.repository';

jest.mock(
  'src/@common/database/database.providers',
  () => ({ DATASOURCE_TOKEN: 'DATASOURCE_TOKEN' }),
  { virtual: true },
);

jest.mock(
  'src/@common/entities/doctorSchedule.entity',
  () => ({ DoctorSchedule: class DoctorSchedule {} }),
  { virtual: true },
);

type ScheduleRepositoryStub = {
  delete: jest.Mock<(criteria: { doctorId: number }) => Promise<unknown>>;
  create: jest.Mock<(value: object) => object>;
  save: jest.Mock<(entities: unknown[]) => Promise<unknown>>;
  find: jest.Mock<
    (options: { where: { doctorId: number } }) => Promise<unknown>
  >;
};

type TransactionManagerStub = {
  getRepository: () => ScheduleRepositoryStub;
};

type TransactionCallback = (
  manager: TransactionManagerStub,
) => Promise<unknown>;

describe(DoctorSchedulesTypeORMRepository.name, () => {
  const scheduleRepository: ScheduleRepositoryStub = {
    delete: jest.fn<(criteria: { doctorId: number }) => Promise<unknown>>(),
    create: jest.fn<(value: object) => object>(),
    save: jest.fn<(entities: unknown[]) => Promise<unknown>>(),
    find: jest.fn<
      (options: { where: { doctorId: number } }) => Promise<unknown>
    >(),
  };
  const manager = {
    getRepository: jest.fn<() => ScheduleRepositoryStub>(),
  };
  const dataSource = {
    transaction: jest.fn<
      (callback: TransactionCallback) => Promise<unknown>
    >(),
    getRepository: jest.fn<() => ScheduleRepositoryStub>(),
  };

  let repository: DoctorSchedulesTypeORMRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new DoctorSchedulesTypeORMRepository(dataSource as never);
    manager.getRepository.mockReturnValue(scheduleRepository);
    dataSource.transaction.mockImplementation((callback) => callback(manager));
    dataSource.getRepository.mockReturnValue(scheduleRepository);
    scheduleRepository.create.mockImplementation((value) => value);
  });

  it('remove a escala anterior e salva a escala substituta dentro da mesma transação', async () => {
    const shifts = [
      {
        weekDay: 1,
        startTime: '08:00',
        endTime: '12:00',
        slotDurationMinutes: 30,
      },
    ];
    const savedShifts = shifts.map((shift) => ({
      ...shift,
      doctorId: 3,
    }));
    scheduleRepository.save.mockResolvedValue(savedShifts);

    await expect(
      repository.replaceSchedules(3, { shifts } as never),
    ).resolves.toEqual(savedShifts);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(scheduleRepository.delete).toHaveBeenCalledWith({ doctorId: 3 });
    expect(scheduleRepository.create).toHaveBeenCalledWith({
      ...shifts[0],
      doctorId: 3,
    });
    expect(scheduleRepository.save).toHaveBeenCalledWith([
      { ...shifts[0], doctorId: 3 },
    ]);
  });

  it('apaga a escala anterior e persiste lista vazia quando médico deixa de atender', async () => {
    scheduleRepository.save.mockResolvedValue([]);

    await expect(
      repository.replaceSchedules(3, { shifts: [] } as never),
    ).resolves.toEqual([]);

    expect(scheduleRepository.delete).toHaveBeenCalledWith({ doctorId: 3 });
    expect(scheduleRepository.save).toHaveBeenCalledWith([]);
  });

  it('propaga falha no salvamento para que a transação desfaça a exclusão anterior', async () => {
    const databaseError = new Error('Falha ao substituir escala');
    scheduleRepository.save.mockRejectedValue(databaseError);

    await expect(
      repository.replaceSchedules(
        3,
        {
          shifts: [
            {
              weekDay: 1,
              startTime: '08:00',
              endTime: '12:00',
              slotDurationMinutes: 30,
            },
          ],
        } as never,
      ),
    ).rejects.toBe(databaseError);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(scheduleRepository.delete).toHaveBeenCalledWith({ doctorId: 3 });
  });

  it('consulta turnos somente do médico informado', async () => {
    const shifts = [{ id: 1, doctorId: 3, weekDay: 1 }];
    scheduleRepository.find.mockResolvedValue(shifts);

    await expect(repository.findByDoctorId(3)).resolves.toBe(shifts);

    expect(dataSource.getRepository).toHaveBeenCalledTimes(1);
    expect(scheduleRepository.find).toHaveBeenCalledWith({
      where: { doctorId: 3 },
    });
  });
});
