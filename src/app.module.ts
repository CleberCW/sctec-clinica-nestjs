import { Module } from '@nestjs/common';

import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './@common/filters/http-exception.filter';
import { DatabaseModule } from './@common/database/database.modules';
import { UserModule } from './users/user.module';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import z from 'zod';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from './auth/jwt.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AdminSeedModule } from './@common/database/seeders/admin-seed.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    AdminSeedModule,
    AuthModule,
    JwtModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: z.object({
        PORT: z.coerce.number().default(3000),
        DB_HOST: z.string(),
        DB_PORT: z.coerce.number(),
        DB_USER: z.string(),
        DB_PASSWORD: z.string(),
        DB_NAME: z.string(),
        JWT_SECRET: z.string(),
        JWT_ENCRYPTION_KEY: z.string(),
        INITIAL_ADMIN_EMAIL: z.email(),
        INITIAL_ADMIN_PASSWORD: z.string().min(6),
      }),
    }),
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
