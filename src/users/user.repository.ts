import { Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { User } from 'src/@common/entities/user.entity';
import { USER_TYPEORM_REPOSITORY } from './user.providers';

export abstract class UserRepository {
  abstract createAndSaveUser(userData: Partial<User>): Promise<User>;
  abstract getUserByEmail(email: string): Promise<User | null>;
}

@Injectable()
export class UserTypeORMRepository implements UserRepository {
  constructor(
    @Inject(USER_TYPEORM_REPOSITORY)
    private readonly repository: Repository<User>,
  ) {}

  async createAndSaveUser(userData: Partial<User>): Promise<User> {
    const newUser = this.repository.create(userData);

    return await this.repository.save(newUser);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
      },
      relations: {
        roles: true,
      },
    });
  }
}
