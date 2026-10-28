import { Module } from '@nestjs/common';
import { roleProviders } from './role.providers';
import { ROLE_REPOSITORY } from './role.repository';

@Module({
  providers: [...roleProviders],
  exports: [ROLE_REPOSITORY],
})
export class RoleModule {}
