import { DoctorSchedulesTypeORMRepository } from './doctors-schedules.repository';

export const DOCTOR_SCHEDULES_REPOSITORY = 'DOCTOR_SCHEDULES_REPOSITORY';

export const doctorSchedulesProviders = [
  {
    provide: DOCTOR_SCHEDULES_REPOSITORY,
    useClass: DoctorSchedulesTypeORMRepository,
  },
];
