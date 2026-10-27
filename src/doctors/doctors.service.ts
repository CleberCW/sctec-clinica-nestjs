import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { ROLES } from 'src/@common/entities/role.entity';
import { Doctor } from './entities/doctor.entity';
import { DoctorsRepository } from './doctors.repository';
import { RoleRepository } from 'src/users/role.repository';
import { UserRegisterDto } from 'src/users/dto/user-register.dto';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly doctorsRepository: DoctorsRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async create(
    createDoctorDto: CreateDoctorDto,
    createUserDto: UserRegisterDto,
  ): Promise<Doctor> {
    const doctorRole = await this.roleRepository.findOne(ROLES.DOCTOR);
    if (!doctorRole) {
      throw new InternalServerErrorException(
        'O papel de doctor não existe no sistema.',
      );
    }

    const doctor = await this.doctorsRepository.createWithUser(
      {
        ...createUserDto,
        roles: [doctorRole],
      },
      {
        ...createDoctorDto,
      },
    );

    return doctor;
  }
}
