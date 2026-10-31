import { Injectable } from '@nestjs/common';
import { compare } from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { UserService } from 'src/users/user.service';
import { JwtService } from './jwt.service';
import { DomainError, ERROR_CODE } from 'src/@common/errors/domain.error';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async login(loginData: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userService.getUser(loginData.email);

    if (!user) {
      throw new DomainError(
        'E-mail ou senha inválidos.',
        ERROR_CODE.CREDENCIAIS_INVALIDAS,
      );
    }

    const passwordMatches = await compare(loginData.password, user.password);

    if (!passwordMatches) {
      throw new DomainError(
        'E-mail ou senha inválidos.',
        ERROR_CODE.CREDENCIAIS_INVALIDAS,
      );
    }

    const payload = {
      sub: String(user.id),
      data: {
        userId: user.id,
        email: user.email,
        roles: user.roles.map((role) => role.name),
      },
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
