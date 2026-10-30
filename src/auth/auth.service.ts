import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { UserService } from 'src/users/user.service';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async login(loginData: LoginDto): Promise<{ 'Access Token': string }> {
    const user = await this.userService.getUser(loginData.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const passwordMatches = await compare(loginData.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: String(user.id),
      data: {
        email: user.email,
        roles: user.roles.map((role) => role.name),
      },
    };
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT secret não encontrado');
    }

    const token = this.jwtService.sign(payload);

    return { 'Access Token': token };
  }
}
