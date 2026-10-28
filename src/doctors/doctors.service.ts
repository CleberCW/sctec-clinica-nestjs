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

@Injectable()
export class DoctorsService {
  constructor(
    private readonly doctorsRepository: DoctorsRepository,

    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
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

  async getOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findOne({ id: id });

    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      );
    }

    return doctor;
  }

  async postSchedule(id: number, schedule: CreateDoctorSchedulesDto) {
    return await this.doctorsRepository.replaceSchedules(id, schedule);
  }
}
