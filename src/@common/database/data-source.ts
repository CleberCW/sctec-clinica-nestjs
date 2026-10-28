import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { Appointment } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { DoctorSchedule } from '../entities/doctorSchedule.entity';
import { Log } from '../entities/log.entity';
import { MedicalRecordEntry } from '../entities/medicalRecord.entity';
import { Patient } from '../entities/patient.entity';

const AppDataSource = new DataSource({
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

export default AppDataSource;
