import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { Role } from 'src/@common/entities/role.entity';
import { DataSource } from 'typeorm';
import {
  ROLE_TYPEORM_REPOSITORY,
  RoleRepository,
  RoleTypeOrmRepository,
} from './role.repository';

export const roleProviders = [
  {
    provide: ROLE_TYPEORM_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
    inject: [DATASOURCE_TOKEN],
  },
  {
    provide: RoleRepository,
    useClass: RoleTypeOrmRepository,
  },
];
