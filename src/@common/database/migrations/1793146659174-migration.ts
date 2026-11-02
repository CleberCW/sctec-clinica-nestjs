import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1793146659174 implements MigrationInterface {
  name = 'Migration1793146659174';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd584282015842064279b32a3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" DROP CONSTRAINT "CHK_SCHEDULE_DAY"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" DROP COLUMN "dayOfWeek"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" ADD "weekDay" smallint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" ADD "slotDurationMinutes" integer NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f642d3335d6463569bfb823a54" ON "doctor_schedules"  ("doctorId", "weekDay") `,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" ADD CONSTRAINT "CHK_SCHEDULE_DAY" CHECK ("weekDay" BETWEEN 0 AND 6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" DROP CONSTRAINT "CHK_SCHEDULE_DAY"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f642d3335d6463569bfb823a54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" DROP COLUMN "slotDurationMinutes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" DROP COLUMN "weekDay"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" ADD "dayOfWeek" smallint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" ADD CONSTRAINT "CHK_SCHEDULE_DAY" CHECK ((("dayOfWeek" >= 0) AND ("dayOfWeek" <= 6)))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd584282015842064279b32a3b" ON "doctor_schedules" USING btree ("dayOfWeek", "doctorId") `,
    );
  }
}
