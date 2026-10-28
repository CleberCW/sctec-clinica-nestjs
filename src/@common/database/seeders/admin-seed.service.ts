import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { UserService } from 'src/users/user.service';
import { ConfigService } from '@nestjs/config';
import { ROLES } from 'src/@common/entities/role.entity';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.run();
  }

  private async run() {
    const adminEmail = this.configService.get<string>('INITIAL_ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>(
      'INITIAL_ADMIN_PASSWORD',
    );

    if (!adminEmail || !adminPassword) {
      throw new Error('Não foi possível encontrar o email e senha do admin');
    }

    const adminExists = await this.userService.getUser(adminEmail);

    if (!adminExists) {
      const user = await this.userService.registerUser({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        roles: [ROLES.ADMIN],
      });

      if (!user) {
        throw new Error('Não foi possível criar o usuário admin');
      }

      this.logger.log(
        'Usuário administrador mestre inicial criado com sucesso!',
      );
    } else {
      this.logger.log(
        'ℹAdministrador mestre já existente. Pulando semente inicial.',
      );
    }
  }
}
