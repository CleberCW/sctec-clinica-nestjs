import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { AuthUserDto } from '../dtos/auth-user.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    return getUserJwt(ctx);
  },
);

export function getUserJwt(ctx: ExecutionContext) {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request['user'] as AuthUserDto;
}
