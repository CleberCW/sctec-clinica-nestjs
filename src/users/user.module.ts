import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { roleProviders } from './role.providers';
import { userProviders } from './user.providers';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [...userProviders, ...roleProviders, UserService],
  exports: [UserService],
})
export class UserModule {}
