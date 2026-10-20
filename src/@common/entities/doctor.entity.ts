import {
  Entity,
  Unique,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { DoctorSchedule } from './doctorSchedule.entity';
import { User } from './user.entity';

@Entity('doctors')
@Unique('UQ_DOCTOR_CRM', ['crm'])
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  crm!: string;

  @OneToOne(() => User, (user) => user.doctor, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 255 })
  contactEmail!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @OneToMany(() => DoctorSchedule, (schedule) => schedule.doctor)
  schedules!: DoctorSchedule[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments!: Appointment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
