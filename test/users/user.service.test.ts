import { UnauthorizedException } from '@nestjs/common';
import { User } from 'src/@common/entities/user.entity';
import { JwtService } from 'src/auth/jwt.service';
import { CreateUserRepositoryInput } from 'src/users/dto/create-user-repository.dto';
import { UserRepository } from 'src/users/user.repository';
import { expect, it, describe, beforeAll, jest } from '@jest/globals';
import { UserService } from 'src/users/user.service';
import { Role, ROLE_NAMES, RoleName } from 'src/@common/entities/role.entity';
import { RoleRepository } from 'src/users/role.repository';
import { LoginDto } from 'src/users/dto/login.dto';

class UserRepositoryMock implements UserRepository {
  private memoryDb = new Map<number, User>();

  private idSequence = 0;

  async save(user: CreateUserRepositoryInput): Promise<User> {
    const userEntity = new User();
    this.idSequence++;
    userEntity.id = this.idSequence;
    userEntity.createdAt = new Date();
    userEntity.firstName = user.firstName;
    userEntity.lastName = user.lastName;
    userEntity.email = user.email;
    userEntity.hashedPassword = user.hashedPassword;
    userEntity.roles = user.roles ?? [];
    this.memoryDb.set(userEntity.id, userEntity);

    return Promise.resolve(userEntity);
  }
  async getUserByEmail(email: string): Promise<User | null> {
    const user = [...this.memoryDb.values()].find(
      (user) => user.email === email,
    );
    return Promise.resolve(user ?? null);
  }
}

jest.mock('bcrypt', () => {
  return {
    compare: jest.fn().mockImplementation((a, b) => Promise.resolve(a === b)),
  };
});

class RoleRepositoryMock implements RoleRepository {
  async findByName(role: RoleName): Promise<Role | null> {
    if (!(role in ROLE_NAMES)) {
      throw new Error('Role doesnt exist');
    }
    const mockRole = new Role();

    mockRole.id = 1;
    mockRole.name = role;
    mockRole.createdAt = new Date();

    return Promise.resolve(mockRole);
  }
}

describe(UserService.name, () => {
  const userRepositoryMock = new UserRepositoryMock();
  const roleRepositoryMock = new RoleRepositoryMock();

  beforeAll(async () => {
    const role = await roleRepositoryMock.findByName('user');

    await userRepositoryMock.save({
      firstName: 'Arnildo',
      lastName: 'Pereira',
      email: 'ap@email.com',
      hashedPassword: 'fafdgtregfdgredfdg',
      roles: [role!],
    });
  });

  describe('login', () => {
    it('should login the user', async () => {
      const jwtServiceMock = {
        sign: jest.fn().mockReturnValue('fafdgtregfdgredfdg'),
      } as unknown as JwtService;
      const service = new UserService(
        userRepositoryMock,
        roleRepositoryMock,
        jwtServiceMock,
      );

      const dto: LoginDto = {
        email: 'ap@email.com',
        password: 'batata',
      };

      const result = await service.loginUser(dto);

      expect(result).toEqual({
        jwt: 'fafdgtregfdgredfdg',
      });
    });

    it('should throw unauthorized if user password is wrong', async () => {
      const jwtServiceMock = {
        sign: jest.fn().mockReturnValue('batata'),
      } as unknown as JwtService;

      const service = new UserService(
        userRepositoryMock,
        roleRepositoryMock,
        jwtServiceMock,
      );

      const wrongDto: LoginDto = {
        email: 'ap@email.com',
        password: 'tomate',
      };

      const error = await service
        .loginUser(wrongDto)
        .catch((err) => err as Error);

      expect(error).toBeInstanceOf(UnauthorizedException);
    });

    it('should throw unauthorized if user is not found', async () => {
      const jwtServiceMock = {
        sign: jest.fn().mockReturnValue('batata'),
      } as unknown as JwtService;

      const service = new UserService(
        userRepositoryMock,
        roleRepositoryMock,
        jwtServiceMock,
      );

      const wrongDto: LoginDto = {
        email: 'outro@email.com',
        password: 'batata',
      };

      const error = await service
        .loginUser(wrongDto)
        .catch((err) => err as Error);

      expect(error).toBeInstanceOf(UnauthorizedException);
    });
  });
});
