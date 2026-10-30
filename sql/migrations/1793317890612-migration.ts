import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1793317890612 implements MigrationInterface {
  name = 'Migration1793317890612';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS btree_gist;
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "EXCL_APPOINTMENT_DOCTOR_OVERLAP"
      EXCLUDE USING gist (
        "doctorId" WITH =,
        tstzrange("startsAt", "endsAt", '[)') WITH &&
      )
      WHERE (
        "status" <> 'cancelled'
        AND "deletedAt" IS NULL
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "EXCL_APPOINTMENT_PATIENT_OVERLAP"
      EXCLUDE USING gist (
        "patientId" WITH =,
        tstzrange("startsAt", "endsAt", '[)') WITH &&
      )
      WHERE (
        "status" <> 'cancelled'
        AND "deletedAt" IS NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
      DROP CONSTRAINT "EXCL_APPOINTMENT_PATIENT_OVERLAP";
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      DROP CONSTRAINT "EXCL_APPOINTMENT_DOCTOR_OVERLAP";
    `);
  }
}
