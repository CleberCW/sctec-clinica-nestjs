import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Permission } from './@common/entities/permissions.entity';
import { Role } from './@common/entities/role.entity';
import { User } from './@common/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [User, Role, Permission],

  migrations: ['sql/migrations/*.ts'],

  synchronize: false,
});
