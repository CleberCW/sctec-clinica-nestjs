import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { Role } from 'src/@common/entities/role.entity';
import { DataSource } from 'typeorm';
import {
  ROLE_REPOSITORY,
  ROLE_TYPEORM_REPOSITORY,
  RoleTypeOrmRepository,
} from './role.repository';

export const roleProviders = [
  {
    provide: ROLE_TYPEORM_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
    inject: [DATASOURCE_TOKEN],
  },
  {
    provide: ROLE_REPOSITORY,
    useClass: RoleTypeOrmRepository,
  },
];
