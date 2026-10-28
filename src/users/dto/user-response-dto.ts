import { Expose, Type } from 'class-transformer';
import { RoleResponseDto } from 'src/roles/dtos/role-response.dto';

export class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  email!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  @Type(() => RoleResponseDto)
  roles!: RoleResponseDto[];
}
