import { DATASOURCE_TOKEN } from 'src/@common/database/database.providers';
import { User } from 'src/@common/entities/user.entity';
import { DataSource } from 'typeorm';
import {
  USER_TYPEORM_REPOSITORY,
  UserRepository,
  UserTypeORMRepository,
} from './user.repository';

export const userProviders = [
  {
    provide: USER_TYPEORM_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: [DATASOURCE_TOKEN],
  },
  {
    provide: UserRepository,
    useClass: UserTypeORMRepository,
  },
];
