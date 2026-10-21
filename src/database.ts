import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Role } from './@common/entities/role.entity';
import { User } from './@common/entities/user.entity';
import { Appointment } from './@common/entities/appointment.entity';
import { Doctor } from './@common/entities/doctor.entity';
import { DoctorSchedule } from './@common/entities/doctorSchedule.entity';
import { Log } from './@common/entities/log.entity';
import { MedicalRecordEntry } from './@common/entities/medicalRecord.entity';
import { Patient } from './@common/entities/patient.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [
    User,
    Role,
    Doctor,
    Patient,
    DoctorSchedule,
    Appointment,
    MedicalRecordEntry,
    Log,
  ],

  migrations: ['sql/migrations/*.ts'],

  synchronize: false,
});
