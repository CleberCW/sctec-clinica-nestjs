import { Expose } from 'class-transformer';

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
  roles!: any[];
}
