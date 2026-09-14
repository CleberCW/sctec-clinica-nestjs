import { Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { User } from 'src/@common/entities/user.entity';
import { CreateUserRepositoryInput } from './dto/create-user-repository.dto';
import { USER_TYPEORM_REPOSITORY } from './user.providers';

export abstract class UserRepository {
  abstract save(user: CreateUserRepositoryInput): Promise<User>;
  abstract getUserByEmail(email: string): Promise<User | null>;
}

@Injectable()
export class UserTypeORMRepository implements UserRepository {
  constructor(
    @Inject(USER_TYPEORM_REPOSITORY)
    private readonly repository: Repository<User>,
  ) {}

  async save(user: CreateUserRepositoryInput): Promise<User> {
    const dbUser = await this.repository.save(user);

    return {
      id: dbUser.id,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      email: dbUser.email,
      roles: dbUser.roles,
      createdAt: dbUser.createdAt,
    } as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: {
        email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        hashedPassword: true,
        createdAt: true,
      },
      relations: {
        roles: true,
      },
    });
  }
}
