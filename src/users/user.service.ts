import { BadRequestException, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { UserRepository } from './user.repository';
import { UserRegisterDto } from './dto/user-register.dto';
import { RoleRepository } from './role.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async registerUser(userData: UserRegisterDto) {
    const hashedPassword = await hash(userData.password, 10);

    const roles = await this.roleRepository.findByNames(userData.roles);

    if (!roles || roles.length !== userData.roles.length) {
      throw new BadRequestException(
        'Uma ou mais roles informadas não existem no sistema.',
      );
    }

    const dbUser = await this.userRepository.createAndSaveUser({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      roles: roles,
    });

    return dbUser;
  }

  async getUser(email: string) {
    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      return null;
    }

    return user;
  }
}
