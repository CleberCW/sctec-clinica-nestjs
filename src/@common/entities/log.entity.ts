import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export const ENTITY_TYPES = [
  'user',
  'patient',
  'appointment',
  'doctor',
  'doctor_schedule',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ACTIONS = ['create', 'update', 'delete', 'read'] as const;
export type Action = (typeof ACTIONS)[number];

@Entity('logs')
@Index(['entityType', 'entityId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['requestId'])
export class Log {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'enum', enum: ENTITY_TYPES })
  entityType!: EntityType;

  @Column({ type: 'enum', enum: ACTIONS })
  action!: Action;

  @Column({ type: 'int', nullable: true })
  entityId!: number | null;

  @Column({ type: 'int', nullable: true })
  userId!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValues!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  userSnapshot!: { name?: string; email?: string; roles?: string[] } | null;

  @Column({ type: 'inet', nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  requestId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
