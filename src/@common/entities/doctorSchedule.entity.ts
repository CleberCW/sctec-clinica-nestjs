import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Check,
  JoinColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

@Entity('doctor_schedules')
@Index(['doctorId', 'weekDay'])
@Check('CHK_SCHEDULE_DAY', '"weekDay" BETWEEN 0 AND 6')
@Check('CHK_SCHEDULE_TIME', '"startTime" < "endTime"')
export class DoctorSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'smallint' })
  weekDay!: DayOfWeek;

  @Column({ type: 'time' })
  startTime!: string; // 'HH:mm:ss'

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'int' })
  slotDurationMinutes!: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.schedules, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor;

  @Column({ type: 'int' })
  doctorId!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
