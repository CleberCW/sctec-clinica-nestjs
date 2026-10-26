import { In, Repository } from 'typeorm';
import type { Role, RoleEnum } from '../@common/entities/role.entity.js';
import { Inject, Injectable } from '@nestjs/common';

export abstract class RoleRepository {
  abstract findByNames(role: RoleEnum[]): Promise<Role[] | null>;
}

export const ROLE_TYPEORM_REPOSITORY = 'ROLE_TYPEORM_REPOSITORY';
export const ROLE_REPOSITORY = 'ROLE_REPOSITORY';

@Injectable()
export class RoleTypeOrmRepository implements RoleRepository {
  constructor(
    @Inject(ROLE_TYPEORM_REPOSITORY)
    private readonly repository: Repository<Role>,
  ) {}

  async findByNames(roleNames: RoleEnum[]): Promise<Role[]> {
    return await this.repository.findBy({
      name: In(roleNames),
    });
  }
}
