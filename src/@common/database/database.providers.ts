import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { Appointment } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { DoctorSchedule } from '../entities/doctorSchedule.entity';
import { Log } from '../entities/log.entity';
import { MedicalRecordEntry } from '../entities/medicalRecord.entity';
import { Patient } from '../entities/patient.entity';

export const DATASOURCE_TOKEN = 'DATA_SOURCE';

export const databaseProviders = [
  {
    provide: DATASOURCE_TOKEN,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
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
        synchronize: false,
      });

      return dataSource.initialize();
    },
  },
];
