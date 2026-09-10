import { JwtPayload } from 'jsonwebtoken';
import { RoleName } from 'src/entities/role.entity';

export interface AuthUserDto extends JwtPayload {
  data: {
    email: string;
    roles: RoleName[];
  };
}
