import 'dotenv/config';
import { hash } from 'bcrypt';
import { NestFactory } from '@nestjs/core';
import { DataSource, Repository } from 'typeorm';

import { AppModule } from '../../app.module';
import { Permission } from '../entities/permissions.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';

const permissions = [
  'user:create',
  'user:read',
  'user:update',
  'user:delete',

  'role:create',
  'role:read',
  'role:update',
  'role:delete',
];

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get<DataSource>('DATA_SOURCE');

    const permissionRepository = dataSource.getRepository(Permission);
    const roleRepository = dataSource.getRepository(Role);
    const userRepository = dataSource.getRepository(User);

    const permissionEntities: Permission[] = [];

    for (const permissionName of permissions) {
      let permission = await permissionRepository.findOne({
        where: {
          name: permissionName,
        },
      });

      if (!permission) {
        permission = permissionRepository.create({
          name: permissionName,
        });

        await permissionRepository.save(permission);
      }

      permissionEntities.push(permission);
    }

    const adminRole = await ensureRole(roleRepository, 'admin');
    const userRole = await ensureRole(roleRepository, 'user');
    const ownerRole = await ensureRole(roleRepository, 'owner');

    adminRole.permissions = permissionEntities;

    userRole.permissions = permissionEntities.filter(
      (permission) => permission.name === 'user:read',
    );

    ownerRole.permissions = permissionEntities.filter((permission) =>
      ['user:create', 'user:read', 'user:update'].includes(permission.name),
    );

    await roleRepository.save([adminRole, userRole, ownerRole]);

    await ensureAdminUser(userRepository, adminRole);

    console.log('Bootstrap concluído.');
  } finally {
    await app.close();
  }
}

async function ensureRole(
  roleRepository: Repository<Role>,
  name: 'admin' | 'user' | 'owner',
): Promise<Role> {
  let role = await roleRepository.findOne({
    where: { name },
    relations: {
      permissions: true,
    },
  });

  if (!role) {
    role = roleRepository.create({
      name,
      permissions: [],
    });

    await roleRepository.save(role);
  }

  return role;
}

async function ensureAdminUser(
  userRepository: Repository<User>,
  adminRole: Role,
): Promise<void> {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD são obrigatórias.',
    );
  }

  const existingUser = await userRepository.findOne({
    where: { email },
    relations: {
      roles: true,
    },
  });

  if (existingUser) {
    console.log(`Usuário ${email} já existe. Nenhuma alteração realizada.`);
    return;
  }

  const hashedPassword = await hash(password, 10);

  const admin = userRepository.create({
    firstName: 'System',
    lastName: 'Administrator',
    email,
    hashedPassword,
    roles: [adminRole],
  });

  await userRepository.save(admin);

  console.log(`Admin inicial criado: ${email}`);
}

bootstrap().catch((error: unknown) => {
  console.error('Erro durante bootstrap:', error);
  process.exit(1);
});
