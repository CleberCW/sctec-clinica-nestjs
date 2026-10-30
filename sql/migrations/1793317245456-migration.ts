import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1793317245456 implements MigrationInterface {
  name = 'Migration1793317245456';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4698ba259c0dcf0a66a7c5f9e9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5643f83e97b3c0ca5a5148409"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "EXCL_APPOINTMENT_DOCTOR_OVERLAP"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "EXCL_APPOINTMENT_PATIENT_OVERLAP"`,
    );
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "startAt"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "endAt"`);
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd57ab956e23c0fcf9f861c86e" ON "appointments"  ("patientId", "startsAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d834f30bb223321eac0473c75d" ON "appointments"  ("doctorId", "startsAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d834f30bb223321eac0473c75d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fd57ab956e23c0fcf9f861c86e"`,
    );
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "endsAt"`);
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "startsAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "endAt" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "startAt" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "EXCL_APPOINTMENT_PATIENT_OVERLAP" EXCLUDE USING gist ("patientId" WITH =, tstzrange("startAt", "endAt", '[)'::text) WITH &&) WHERE (((status <> 'cancelled'::appointments_status_enum) AND ("deletedAt" IS NULL)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "EXCL_APPOINTMENT_DOCTOR_OVERLAP" EXCLUDE USING gist ("doctorId" WITH =, tstzrange("startAt", "endAt", '[)'::text) WITH &&) WHERE (((status <> 'cancelled'::appointments_status_enum) AND ("deletedAt" IS NULL)))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5643f83e97b3c0ca5a5148409" ON "appointments" USING btree ("doctorId", "startAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4698ba259c0dcf0a66a7c5f9e9" ON "appointments" USING btree ("patientId", "startAt") `,
    );
  }
}
