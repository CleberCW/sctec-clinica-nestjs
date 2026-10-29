import {
  DOCTOR_SCHEDULES_REPOSITORY,
  DoctorSchedulesTypeORMRepository,
} from './doctors-schedules.repository';

export const doctorSchedulesProviders = [
  {
    provide: DOCTOR_SCHEDULES_REPOSITORY,
    useClass: DoctorSchedulesTypeORMRepository,
  },
];
