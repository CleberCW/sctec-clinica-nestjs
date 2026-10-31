import { describe, expect, it, jest, beforeEach } from '@jest/globals';
jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { compare } from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { UserService } from '../../src/users/user.service';
import { JwtService } from '../../src/auth/jwt.service';
import { DomainError, ERROR_CODE } from '../../src/@common/errors/domain.error';
import { ROLES } from '../../src/@common/entities/role.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

function errorCode(error: unknown): string | undefined {
  if (!(error instanceof DomainError)) return undefined;
  return (error.getResponse() as { code?: string }).code;
}

async function expectInvalidCredentials(operation: Promise<unknown>): Promise<void> {
  const error = await operation.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(DomainError);
  expect(errorCode(error)).toBe(ERROR_CODE.CREDENCIAIS_INVALIDAS);
}

describe(AuthService.name, () => {
  const userService = { getUser: jest.fn() };
  const jwtService = { sign: jest.fn() };
  let service: AuthService;

  const user = {
    id: 17,
    email: 'doctor@medclinic.com',
    password: '$2b$10$stored-hash',
    roles: [{ name: ROLES.DOCTOR }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userService as unknown as UserService,
      jwtService as unknown as JwtService,
    );
    userService.getUser.mockResolvedValue(user);
    (compare as jest.Mock).mockResolvedValue(true);
    jwtService.sign.mockReturnValue('signed-access-token');
  });

  it('compares the supplied password against the stored hash and returns accessToken', async () => {
    const result = await service.login({
      email: user.email,
      password: 'plain-password',
    });

    expect(compare).toHaveBeenCalledWith('plain-password', user.password);
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: '17',
      data: {
        email: user.email,
        roles: [ROLES.DOCTOR],
      },
    });
    expect(result).toEqual({ accessToken: 'signed-access-token' });
  });

  it('returns the same invalid-credentials error when the user does not exist', async () => {
    userService.getUser.mockResolvedValue(null);

    await expectInvalidCredentials(
      service.login({ email: 'missing@medclinic.com', password: 'irrelevant' }),
    );
    expect(compare).not.toHaveBeenCalled();
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('returns invalid credentials when the password hash does not match', async () => {
    (compare as jest.Mock).mockResolvedValue(false);

    await expectInvalidCredentials(
      service.login({ email: user.email, password: 'wrong-password' }),
    );
    expect(compare).toHaveBeenCalledWith('wrong-password', user.password);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
