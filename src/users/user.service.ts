import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { UserRepository } from './user.repository';
import { RegisterUserDto } from './dto/register-user-controller.dto';
import { RoleRepository } from './role.repository';
import { LoginDto } from './dto/login.dto';
import { JwtService } from 'src/auth/jwt.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(userData: RegisterUserDto) {
    const hashPassword = await hash(userData.password, 10);

    const role = await this.roleRepository.findByName('user');

    if (!role) {
      throw new Error('Default user role not found');
    }

    const dbUser = await this.userRepository.save({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      hashedPassword: hashPassword,
      roles: [role],
    });

    return {
      id: dbUser.id,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      email: dbUser.email,
      roles: dbUser.roles,
      createdAt: dbUser.createdAt,
    };
  }

  async loginUser(loginData: LoginDto) {
    const user = await this.userRepository.getUserByEmail(loginData.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const passwordMatches = await compare(
      loginData.password,
      user.hashedPassword,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException();
    }

    const payload = {
      email: user.email,
      role: [...user.roles.map((role) => role.name)],
    };
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT secret não encontrado');
    }

    const token = this.jwtService.sign(payload);

    return { 'Access Token': token };
  }

  async getUser(email: string) {
    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
