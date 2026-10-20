import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { Doctor } from './doctor.entity';

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

@Entity('appointments')
@Index(['doctorId', 'startAt'])
@Index(['patientId', 'startAt'])
@Check('CHK_APPOINTMENT_TIME', '"startAt" < "endAt"')
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Patient, (patient) => patient.appointments, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @Column({ type: 'int' })
  patientId!: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor;

  @Column({ type: 'int' })
  doctorId!: number;

  @Column({ type: 'timestamptz' })
  startAt!: Date;

  @Column({ type: 'timestamptz' })
  endAt!: Date;

  @Column({ type: 'enum', enum: APPOINTMENT_STATUSES, default: 'scheduled' })
  status!: AppointmentStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
