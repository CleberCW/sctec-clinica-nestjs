import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { roleProviders } from './role.providers';
import { RoleRepository, RoleTypeOrmRepository } from './role.repository';
import { userProviders } from './user.providers';
import { UserRepository, UserTypeORMRepository } from './user.repository';
import { UserService } from './user.service';
import { JwtModule } from 'src/auth/jwt.module';

@Module({
  imports: [JwtModule],
  controllers: [UserController],
  providers: [
    ...userProviders,
    ...roleProviders,
    UserService,
    {
      provide: UserRepository,
      useClass: UserTypeORMRepository,
    },
    {
      provide: RoleRepository,
      useClass: RoleTypeOrmRepository,
    },
  ],
})
export class UserModule {}
