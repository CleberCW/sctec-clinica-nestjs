import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response-dto';

@Exclude()
export class DoctorResponseDto {
  @Expose()
  id!: number;

  @Expose()
  crm!: string;

  @Expose()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  @Expose()
  userId!: number;

  @Expose()
  contactEmail!: string;

  @Expose()
  phone!: string;

  @Expose()
  createdAt!: Date;
}
