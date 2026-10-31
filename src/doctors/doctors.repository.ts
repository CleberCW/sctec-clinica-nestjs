import {
  DataSource,
  ILike,
  IsNull,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { User } from 'src/@common/entities/user.entity';
import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import { Doctor } from 'src/@common/entities/doctor.entity';
import { GetDoctorsDto } from './dto/get-doctors.dto';
import { APPOINTMENT_STATUSES } from 'src/@common/entities/appointment.entity';

export abstract class DoctorsRepository {
  abstract createWithUser(
    userData: Partial<User>,
    doctorData: Partial<Doctor>,
  ): Promise<Doctor>;
  abstract find(query: GetDoctorsDto): Promise<Doctor[]>;
  abstract findOne(options: {
    id?: number;
    schedules?: boolean;
    userId?: number;
  }): Promise<Doctor | null>;
  abstract findCalendar(
    doctorId: number,
    from: string,
    to: string,
  ): Promise<Doctor | null>;
}

export const DOCTORS_TYPEORM_REPOSITORY = 'DOCTOR_REPOSITORY';

@Injectable()
export class DoctorsTypeORMRepository implements DoctorsRepository {
  constructor(
    @Inject(DOCTORS_TYPEORM_REPOSITORY)
    private readonly repository: Repository<Doctor>,

    @Inject(DATASOURCE_TOKEN)
    private readonly dataSource: DataSource,
  ) {}

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
      };

      if (driverError.code === '23505') {
        switch (driverError.constraint) {
          case 'UQ_USER_EMAIL':
            throw new DomainError(
              'E-mail já cadastrado.',
              ERROR_CODE.EMAIL_JA_CADASTRADO,
            );

          case 'UQ_DOCTOR_CRM':
            throw new DomainError(
              'CRM já cadastrado.',
              ERROR_CODE.CRM_JA_CADASTRADO,
            );
        }
      }
    }

    throw error;
  }

  async createWithUser(
    userData: Partial<User>,
    doctorData: Partial<Doctor>,
  ): Promise<Doctor> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const userRepository = manager.getRepository(User);
        const doctorRepository = manager.getRepository(Doctor);

        const user = await userRepository.save(userRepository.create(userData));

        const doctor = doctorRepository.create({
          ...doctorData,
          user,
        });

        return doctorRepository.save(doctor);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async find(query: GetDoctorsDto): Promise<Doctor[]> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    return this.repository.find({
      skip: pageSize * (page - 1),
      take: pageSize,
      where: {
        user: {
          ...(query.name?.trim() && { name: ILike(`%${query.name.trim()}%`) }),
        },
      },
      relations: {
        user: true,
      },
    });
  }

  async findOne(options: {
    id?: number;
    schedules?: boolean;
    userId?: number;
  }): Promise<Doctor | null> {
    const { schedules, ...whereFilters } = options;

    return this.repository.findOne({
      where: {
        ...whereFilters,
        deletedAt: IsNull(),
      },
      relations: {
        schedules: schedules ?? false,
      },
    });
  }

  async findCalendar(
    doctorId: number,
    from: string,
    to: string,
  ): Promise<Doctor | null> {
    const fromDate = new Date(`${from}T00:00:00.000Z`);

    // Limite exclusivo: meia-noite do dia seguinte ao "to".
    const toDate = new Date(`${to}T00:00:00.000Z`);
    toDate.setUTCDate(toDate.getUTCDate() + 1);

    return this.repository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.schedules', 'schedule')
      .leftJoinAndSelect(
        'doctor.appointments',
        'appointment',
        `
        appointment.startsAt < :toDate
        AND appointment.endsAt > :fromDate
        AND appointment.status != :cancelled
      `,
        {
          fromDate,
          toDate,
          cancelled: APPOINTMENT_STATUSES.CANCELLED,
        },
      )
      .where('doctor.id = :doctorId', { doctorId })
      .andWhere('doctor.deletedAt IS NULL')
      .getOne();
  }
}
