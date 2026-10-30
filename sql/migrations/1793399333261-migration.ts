import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1793399333261 implements MigrationInterface {
  name = 'Migration1793399333261';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "EXCL_APPOINTMENT_DOCTOR_OVERLAP"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "EXCL_APPOINTMENT_PATIENT_OVERLAP"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."appointments_status_enum" RENAME TO "appointments_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_status_enum" AS ENUM('scheduled', 'in_progress', 'done', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "public"."appointments_status_enum" USING "status"::"text"::"public"."appointments_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'scheduled'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."appointments_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "CHK_APPOINTMENT_TIME" CHECK ("startsAt" < "endsAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "CHK_APPOINTMENT_TIME"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_status_enum_old" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "public"."appointments_status_enum_old" USING "status"::"text"::"public"."appointments_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'scheduled'`,
    );
    await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."appointments_status_enum_old" RENAME TO "appointments_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "EXCL_APPOINTMENT_PATIENT_OVERLAP" EXCLUDE USING gist ("patientId" WITH =, tstzrange("startsAt", "endsAt", '[)'::text) WITH &&) WHERE (((status <> 'cancelled'::appointments_status_enum) AND ("deletedAt" IS NULL)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "EXCL_APPOINTMENT_DOCTOR_OVERLAP" EXCLUDE USING gist ("doctorId" WITH =, tstzrange("startsAt", "endsAt", '[)'::text) WITH &&) WHERE (((status <> 'cancelled'::appointments_status_enum) AND ("deletedAt" IS NULL)))`,
    );
  }
}
