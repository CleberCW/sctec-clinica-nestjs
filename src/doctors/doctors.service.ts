import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { ROLES } from 'src/@common/entities/role.entity';
import { DoctorsRepository } from './doctors.repository';
import { ROLE_REPOSITORY, RoleRepository } from 'src/roles/role.repository';
import { Doctor } from 'src/@common/entities/doctor.entity';
import { hash } from 'bcrypt';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';
import { GetDoctorsDto } from './dto/get-doctors.dto';
import { CreateDoctorSchedulesDto } from './dto/create-doctor-schedule.dto';
import {
  DOCTOR_SCHEDULES_REPOSITORY,
  DoctorSchedulesRepository,
} from './doctors-schedules.repository';
import { toAbsoluteDayMinutes } from 'src/@common/utils/utils';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly doctorsRepository: DoctorsRepository,

    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,

    @Inject(DOCTOR_SCHEDULES_REPOSITORY)
    private readonly doctorSchedulesRepository: DoctorSchedulesRepository,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const doctorRole = await this.roleRepository.findOne(ROLES.DOCTOR);

    if (!doctorRole) {
      throw new InternalServerErrorException(
        'O papel de doctor não existe no sistema.',
      );
    }

    const hashedPassword = await hash(createDoctorDto.password, 10);

    const { crm, phone, ...userData } = createDoctorDto;

    return this.doctorsRepository.createWithUser(
      {
        ...userData,
        roles: [doctorRole],
        password: hashedPassword,
      },
      {
        crm,
        phone,
        contactEmail: userData.email,
      },
    );
  }

  async getAll(query: GetDoctorsDto): Promise<Doctor[]> {
    return this.doctorsRepository.find(query);
  }

  async getOne(
    id: number,
    options: {
      schedules?: boolean;
      userId?: number;
    } = {},
  ): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findOne({
      id,
      schedules: options.schedules ?? false,
      userId: options.userId,
    });

    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado.',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    return doctor;
  }

  private validateShifts(workSchedule: CreateDoctorSchedulesDto): void {
    workSchedule.shifts.sort((a, b) => {
      if (a.weekDay !== b.weekDay) {
        return a.weekDay - b.weekDay;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    workSchedule.shifts.forEach((shift, index) => {
      const startTimeMinutes = toAbsoluteDayMinutes(shift.startTime);

      const endTimeMinutes = toAbsoluteDayMinutes(shift.endTime);

      if (startTimeMinutes >= endTimeMinutes) {
        throw new DomainError(
          'O horário de início deve ser menor que o horário de término.',
          ERROR_CODE.DADOS_INVALIDOS,
        );
      }

      if (endTimeMinutes - startTimeMinutes < shift.slotDurationMinutes) {
        throw new DomainError(
          'A duração do turno é insuficiente para a duração do atendimento.',
          ERROR_CODE.DADOS_INVALIDOS,
        );
      }

      if (index + 1 >= workSchedule.shifts.length) {
        return;
      }

      if (shift.weekDay !== workSchedule.shifts[index + 1].weekDay) {
        return;
      }
      const nextStartTimeMinutes = toAbsoluteDayMinutes(
        workSchedule.shifts[index + 1].startTime,
      );

      if (endTimeMinutes > nextStartTimeMinutes) {
        throw new DomainError(
          'PRÓXIMO TURNO COMEÇA ANTES DO ATUAL TERMINAR',
          ERROR_CODE.HORARIO_FORA_DA_ESCALA,
        );
      }
    });
  }

  async postSchedule(id: number, schedule: CreateDoctorSchedulesDto) {
    this.validateShifts(schedule);
    {
      const shifts = await this.doctorSchedulesRepository.replaceSchedules(
        id,
        schedule,
      );

      return { shifts };
    }
  }

  async getSchedule(id: number) {
    const shifts = await this.doctorSchedulesRepository.findByDoctorId(id);

    return { shifts };
  }
}
