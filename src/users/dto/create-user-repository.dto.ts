import type { Role } from '../../@common/entities/role.entity.js';

export interface CreateUserRepositoryInput {
  firstName: string;
  lastName: string;
  email: string;
  hashedPassword: string;
  roles?: Role[];
}
