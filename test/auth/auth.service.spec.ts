import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { compare } from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock(
  'src/users/user.service',
  () => ({ UserService: class UserService {} }),
  { virtual: true },
);

jest.mock(
  'src/auth/jwt.service',
  () => ({ JwtService: class JwtService {} }),
  { virtual: true },
);

jest.mock(
  'src/@common/errors/domain.error',
  () => jest.requireActual('../../src/@common/errors/domain.error'),
  { virtual: true },
);

describe(AuthService.name, () => {
  const userService = {
    getUser: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(userService as never, jwtService as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('autentica o usuário comparando a senha informada com o hash armazenado', async () => {
    const user = {
      id: 7,
      name: 'Dra. Helena',
      email: 'helena@medclinic.com',
      password: '$2b$10$hash-armazenado',
      roles: [{ name: 'doctor' }, { name: 'secretary' }],
    };

    userService.getUser.mockResolvedValue(user);
    jest.mocked(compare).mockResolvedValue(true);
    jwtService.sign.mockReturnValue('token-assinado');

    await expect(
      service.login({
        email: user.email,
        password: 'SenhaForte@123',
      }),
    ).resolves.toEqual({ accessToken: 'token-assinado' });

    expect(userService.getUser).toHaveBeenCalledWith(user.email);
    expect(compare).toHaveBeenCalledWith(
      'SenhaForte@123',
      '$2b$10$hash-armazenado',
    );
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: '7',
      data: {
        userId: 7,
        email: user.email,
        roles: ['doctor', 'secretary'],
      },
    });
  });

  it('rejeita e-mail inexistente sem tentar comparar uma senha', async () => {
    userService.getUser.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'inexistente@medclinic.com',
        password: 'SenhaForte@123',
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 401,
        code: 'CREDENCIAIS_INVALIDAS',
      },
    });

    expect(compare).not.toHaveBeenCalled();
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejeita senha incorreta com o mesmo erro usado para e-mail inexistente', async () => {
    userService.getUser.mockResolvedValue({
      id: 7,
      email: 'helena@medclinic.com',
      password: '$2b$10$hash-armazenado',
      roles: [{ name: 'doctor' }],
    });
    jest.mocked(compare).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'helena@medclinic.com',
        password: 'senha-incorreta',
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: 401,
        code: 'CREDENCIAIS_INVALIDAS',
      },
    });

    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('não assina o token quando a comparação de hash falha', async () => {
    userService.getUser.mockResolvedValue({
      id: 8,
      email: 'medico@medclinic.com',
      password: '$2b$10$outro-hash',
      roles: [],
    });
    jest.mocked(compare).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'medico@medclinic.com',
        password: 'qualquer-senha',
      }),
    ).rejects.toBeDefined();

    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
