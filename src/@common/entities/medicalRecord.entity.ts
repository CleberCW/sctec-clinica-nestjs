import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity('medical_record_entries')
@Index(['patientId', 'createdAt'])
@Index(['appointmentId'])
export class MedicalRecordEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Patient, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @Column({ type: 'int' })
  patientId!: number;

  @ManyToOne(() => Doctor, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor;

  @Column({ type: 'int' })
  doctorId!: number;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment | null;

  @Column({ type: 'int', nullable: true })
  appointmentId!: number | null;

  // E se precisar alterar um prontuário? Não se deve alterar/deletar, o melhor é criar um novo e referenciar a correção abaixo
  //Ex.:
  //id:10   “Prescrito 500mg de X”	                    correctsEntryId: null
  //id:11   “Correção: a dose correta é 50mg de X”      correctsEntryId: 10

  @ManyToOne(() => MedicalRecordEntry, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'correctsEntryId' })
  correctsEntry!: MedicalRecordEntry | null;

  @Column({ type: 'int', nullable: true })
  correctsEntryId!: number | null;

  @Column({ type: 'text' })
  text!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
