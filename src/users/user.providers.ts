import { DataSource } from 'typeorm';
import { DATASOURCE_TOKEN } from '../@common/database/database.providers';
import { User } from 'src/@common/entities/user.entity';

export const USER_TYPEORM_REPOSITORY = 'USER_REPOSITORY';

export const userProviders = [
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: [DATASOURCE_TOKEN],
  },
];
