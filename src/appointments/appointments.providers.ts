import {
  AppointmentsRepository,
  AppointmentsTypeORMRepository,
} from './appointments.repository';

export const appointmentProviders = [
  {
    provide: AppointmentsRepository,
    useClass: AppointmentsTypeORMRepository,
  },
];
