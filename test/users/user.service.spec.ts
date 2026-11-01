import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { hash } from 'bcrypt';
import { UserService } from '../../src/users/user.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn<(...args: any[]) => any>(),
  hash: jest.fn<(...args: any[]) => any>(),
}));

jest.mock('../../src/users/user.repository', () => ({
  UserRepository: class UserRepository {},
}));

jest.mock('../../src/roles/role.repository', () => ({
  RoleRepository: class RoleRepository {},
  ROLE_REPOSITORY: 'ROLE_REPOSITORY',
}));

describe(UserService.name, () => {
  const userRepository = {
    createAndSaveUser: jest.fn<(...args: any[]) => any>(),
    getUserByEmail: jest.fn<(...args: any[]) => any>(),
  };
  const roleRepository = {
    findByNames: jest.fn<(...args: any[]) => any>(),
    findOne: jest.fn<(...args: any[]) => any>(),
  };

  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(
      userRepository as never,
      roleRepository as never,
    );
  });

  it('gera o hash da senha e cria o usuário com os perfis encontrados', async () => {
    const role = { id: 1, name: 'secretary' };
    const createdUser = {
      id: 12,
      name: 'Joana Secretária',
      email: 'joana@medclinic.com',
      password: 'hash-gerado',
      roles: [role],
    };

    roleRepository.findByNames.mockResolvedValue([role]);
    jest.mocked(hash).mockResolvedValue('hash-gerado');
    userRepository.createAndSaveUser.mockResolvedValue(createdUser);

    const result = await service.registerUser({
      name: 'Joana Secretária',
      email: 'joana@medclinic.com',
      password: 'SenhaForte@123',
      roles: ['secretary'],
    } as never);

    expect(hash).toHaveBeenCalledWith('SenhaForte@123', 10);
    expect(roleRepository.findByNames).toHaveBeenCalledWith(['secretary']);
    expect(userRepository.createAndSaveUser).toHaveBeenCalledWith({
      name: 'Joana Secretária',
      email: 'joana@medclinic.com',
      password: 'hash-gerado',
      roles: [role],
    });
    expect(result).toBe(createdUser);
  });

  it('recusa a criação quando o repositório não encontra nenhum dos perfis', async () => {
    roleRepository.findByNames.mockResolvedValue(null);
    jest.mocked(hash).mockResolvedValue('hash-gerado');

    await expect(
      service.registerUser({
        name: 'Joana Secretária',
        email: 'joana@medclinic.com',
        password: 'SenhaForte@123',
        roles: ['secretary'],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(userRepository.createAndSaveUser).not.toHaveBeenCalled();
  });

  it('recusa a criação quando apenas parte dos perfis solicitados existe', async () => {
    roleRepository.findByNames.mockResolvedValue([
      { id: 1, name: 'doctor' },
    ]);
    jest.mocked(hash).mockResolvedValue('hash-gerado');

    await expect(
      service.registerUser({
        name: 'Usuário com dois perfis',
        email: 'usuario@medclinic.com',
        password: 'SenhaForte@123',
        roles: ['doctor', 'admin'],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(userRepository.createAndSaveUser).not.toHaveBeenCalled();
  });

  it('propaga falha do repositório ao persistir o usuário', async () => {
    roleRepository.findByNames.mockResolvedValue([
      { id: 1, name: 'secretary' },
    ]);
    jest.mocked(hash).mockResolvedValue('hash-gerado');
    userRepository.createAndSaveUser.mockRejectedValue(
      new Error('Falha de persistência'),
    );

    await expect(
      service.registerUser({
        name: 'Joana Secretária',
        email: 'joana@medclinic.com',
        password: 'SenhaForte@123',
        roles: ['secretary'],
      } as never),
    ).rejects.toThrow('Falha de persistência');
  });

  it('retorna o usuário localizado pelo e-mail', async () => {
    const user = {
      id: 5,
      email: 'admin@medclinic.com',
      roles: [{ name: 'admin' }],
    };
    userRepository.getUserByEmail.mockResolvedValue(user);

    await expect(service.getUser(user.email)).resolves.toBe(user);
    expect(userRepository.getUserByEmail).toHaveBeenCalledWith(user.email);
  });

  it('retorna null quando o e-mail não corresponde a um usuário', async () => {
    userRepository.getUserByEmail.mockResolvedValue(null);

    await expect(
      service.getUser('nao-existe@medclinic.com'),
    ).resolves.toBeNull();
  });
});
