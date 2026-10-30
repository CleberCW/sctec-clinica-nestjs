import {
  Injectable,
  CanActivate,
  Logger,
  ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { JwtService } from 'src/auth/jwt.service';
import {
  RoleMetadata,
  ROLES_METADATA_KEY,
} from '../decorators/roles.decorator';
import { DomainError, ERROR_CODE } from '../errors/domain.error';
import { Request } from 'express';
import { AuthUserDto } from 'src/users/dto/auth-user.dto';

export const JWT_GUARD_AUTH_REQ_KEY = 'user' as const;

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  private logger = new Logger(JwtGuard.name);

  private extractToken(context: ExecutionContext) {
    const expressReq = context.switchToHttp().getRequest<Request>();

    if (!expressReq.headers.authorization) {
      throw new DomainError(
        'Token não providenciado',
        ERROR_CODE.NAO_AUTENTICADO,
      );
    }

    const [bearerString, token] = expressReq.headers.authorization.split(' ');

    if (bearerString !== 'Bearer') {
      throw new DomainError('Token inválido', ERROR_CODE.NAO_AUTENTICADO);
    }
    return token;
  }

  private setPayload(context: ExecutionContext, payload: JwtPayload) {
    const request = context.switchToHttp().getRequest<Request>();
    Object.defineProperties(request, {
      [JWT_GUARD_AUTH_REQ_KEY]: {
        value: payload,
        writable: false,
      },
    });
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const token = this.extractToken(context);
      const payload = this.jwtService.verify(token) as AuthUserDto;

      if (typeof payload === 'string') {
        throw new DomainError(
          'Payload inválido no token',
          ERROR_CODE.NAO_AUTENTICADO,
        );
      }

      if (payload.iss !== this.configService.getOrThrow<string>('JWT_ISSUER')) {
        throw new DomainError(
          'Issuer inválido no token',
          ERROR_CODE.NAO_AUTENTICADO,
        );
      }

      const metadata = this.reflector.getAllAndOverride<RoleMetadata>(
        ROLES_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (
        typeof payload.sub !== 'string' ||
        !Array.isArray(payload.data.roles) ||
        !payload.data.roles.every((role) => typeof role === 'string')
      ) {
        throw new DomainError(
          'Payload inválido no token',
          ERROR_CODE.NAO_AUTENTICADO,
        );
      }

      if (metadata) {
        const hasAccess =
          metadata.mode === 'every'
            ? metadata.requiredRoles.every((role) =>
                payload.data.roles.includes(role),
              )
            : metadata.requiredRoles.some((role) =>
                payload.data.roles.includes(role),
              );

        if (!hasAccess) {
          throw new DomainError('Acesso negado', ERROR_CODE.ACESSO_NEGADO);
        }
      }

      this.setPayload(context, payload);

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new DomainError('Token inválido', ERROR_CODE.NAO_AUTENTICADO);
    }
  }
}
