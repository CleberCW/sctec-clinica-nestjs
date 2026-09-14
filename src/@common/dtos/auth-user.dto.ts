import { JwtPayload } from 'jsonwebtoken';
import { RoleName } from 'src/@common/entities/role.entity';

export interface AuthUserDto extends JwtPayload {
  data: {
    email: string;
    roles: RoleName[];
  };
}
