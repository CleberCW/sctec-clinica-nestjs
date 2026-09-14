import { DataSource } from 'typeorm';
import { DATASOURCE_TOKEN } from '../@common/database/database.providers';
import { Role } from '../@common/entities/role.entity';

export const ROLE_TYPEORM_REPOSITORY = 'ROLE_REPOSITORY';

export const roleProviders = [
  {
    provide: 'ROLE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
    inject: [DATASOURCE_TOKEN],
  },
];
