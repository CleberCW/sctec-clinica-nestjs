import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../entities/role.entity';

export interface RequireRoleOptions {
  mode: 'some' | 'every';
}

export interface RoleMetadata {
  requiredRoles: RoleEnum[];
  mode: 'every' | 'some';
}

export const ROLES_METADATA_KEY = 'REQUIRED_ROLES';

export const RequireRole = (
  roles: RoleEnum[],
  options: RequireRoleOptions = {
    mode: 'some',
  },
) =>
  SetMetadata(ROLES_METADATA_KEY, {
    requiredRoles: roles,
    mode: options.mode,
  });
