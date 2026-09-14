import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Permission } from '../entities/permissions.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';

export const DATASOURCE_TOKEN = 'DATA_SOURCE';

export const databaseProviders = [
  {
    provide: DATASOURCE_TOKEN,
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [User, Role, Permission],
        synchronize: false,
      });

      return dataSource.initialize();
    },
  },
];
