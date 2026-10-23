import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export const ROLES = {
  ADMIN: 'ADMIN',
  SECRETARY: 'SECRETARY',
  DOCTOR: 'DOCTOR',
} as const;

export type RoleEnum = (typeof ROLES)[keyof typeof ROLES];

@Entity('roles')
@Unique('UQ_ROLE_NAME', ['name'])
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: Object.values(ROLES) })
  name!: RoleEnum;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];
}
