import { Repository } from 'typeorm';
import type { Role, RoleName } from '../entities/role.entity.ts';
import { Inject, Injectable } from '@nestjs/common';
import { ROLE_TYPEORM_REPOSITORY } from './role.providers.js';

export abstract class RoleRepository {
  abstract findByName(role: RoleName): Promise<Role | null>;
}

@Injectable()
export class RoleTypeOrmRepository implements RoleRepository {
  constructor(
    @Inject(ROLE_TYPEORM_REPOSITORY)
    private readonly repository: Repository<Role>,
  ) {}

  async findByName(role: RoleName) {
    return await this.repository.findOne({
      where: {
        name: role,
      },
    });
  }
}
