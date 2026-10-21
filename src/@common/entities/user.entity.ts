import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { Doctor } from './doctor.entity';

@Entity('users')
@Index('UQ_USER_EMAIL', ['email'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @ManyToMany(() => Role, (role) => role.users) // OnDelete: 'CASCADE', OnUpdate: 'CASCADE' já são padrão
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctor?: Doctor | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt!: Date | null;

  @DeleteDateColumn({
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt!: Date | null;
}
