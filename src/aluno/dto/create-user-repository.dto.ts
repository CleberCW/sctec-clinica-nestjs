import type { Role } from '../../entities/role.entity.ts';

export interface CreateUserRepositoryInput {
  firstName: string;
  lastName: string;
  email: string;
  hashedPassword: string;
  roles?: Role[];
}
