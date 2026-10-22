import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export const ROLE_NAMES = ['admin', 'secretary', 'doctor'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

@Entity('roles')
@Unique('UQ_ROLE_NAME', ['name'])
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: ROLE_NAMES })
  name!: RoleName;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];
}
