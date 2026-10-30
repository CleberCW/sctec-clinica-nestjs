import { JwtPayload } from 'jsonwebtoken';
import { RoleEnum } from 'src/@common/entities/role.entity';

export interface AuthUserDto extends JwtPayload {
  data: {
    email: string;
    roles: RoleEnum[];
  };
}
