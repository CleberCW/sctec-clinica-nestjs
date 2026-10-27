import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { userProviders } from './user.providers';
import { UserService } from './user.service';
import { RoleModule } from 'src/roles/role.module';

@Module({
  imports: [RoleModule],
  controllers: [UserController],
  providers: [...userProviders, UserService],
  exports: [UserService],
})
export class UserModule {}
