import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1792537389793 implements MigrationInterface {
  name = 'Migration1792537389793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "patients" ("id" SERIAL NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "cpf" character(11) NOT NULL, "birthDate" date NOT NULL, "phone" character varying(20) NOT NULL, "email" character varying(255), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_PATIENT_CPF" UNIQUE ("cpf"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_status_enum" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" SERIAL NOT NULL, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'scheduled', "notes" character varying(500), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_APPOINTMENT_TIME" CHECK ("startAt" < "endAt"), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4698ba259c0dcf0a66a7c5f9e9" ON "appointments"  ("patientId", "startAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5643f83e97b3c0ca5a5148409" ON "appointments"  ("doctorId", "startAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_schedules" ("id" SERIAL NOT NULL, "dayOfWeek" smallint NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "doctorId" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_SCHEDULE_TIME" CHECK ("startTime" < "endTime"), CONSTRAINT "CHK_SCHEDULE_DAY" CHECK ("dayOfWeek" BETWEEN 0 AND 6), CONSTRAINT "PK_a1cab57bc0a680b50d06930b377" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd584282015842064279b32a3b" ON "doctor_schedules"  ("doctorId", "dayOfWeek") `,
    );
    await queryRunner.query(
      `CREATE TABLE "doctors" ("id" SERIAL NOT NULL, "crm" character varying(255) NOT NULL, "userId" integer NOT NULL, "contactEmail" character varying(255) NOT NULL, "phone" character varying(20) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_DOCTOR_CRM" UNIQUE ("crm"), CONSTRAINT "REL_55651e05e46413d510215535ed" UNIQUE ("userId"), CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_USER_EMAIL" ON "users"  ("email") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."roles_name_enum" AS ENUM('admin', 'secretary', 'doctor')`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" "public"."roles_name_enum" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ROLE_NAME" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."logs_entitytype_enum" AS ENUM('user', 'patient', 'appointment', 'doctor', 'doctor_schedule')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."logs_action_enum" AS ENUM('create', 'update', 'delete', 'read')`,
    );
    await queryRunner.query(
      `CREATE TABLE "logs" ("id" BIGSERIAL NOT NULL, "entityType" "public"."logs_entitytype_enum" NOT NULL, "action" "public"."logs_action_enum" NOT NULL, "entityId" integer, "userId" integer, "oldValues" jsonb, "newValues" jsonb, "userSnapshot" jsonb, "ip" inet, "userAgent" character varying(255), "requestId" character varying(255), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_fb1b805f2f7795de79fa69340ba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a4cde6e193d0dbfb9521cc4e70" ON "logs"  ("requestId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_525de5c5b6614c4562f49851a7" ON "logs"  ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99b590f24ff602301034311f83" ON "logs"  ("entityType", "entityId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "medical_record_entries" ("id" SERIAL NOT NULL, "patientId" integer NOT NULL, "doctorId" integer NOT NULL, "appointmentId" integer, "correctsEntryId" integer, "content" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7cfc69d57da589a22681b026de3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08f717ed6ab0a0fa96a94bdf2e" ON "medical_record_entries"  ("appointmentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acc8c825bd03224e81040faedc" ON "medical_record_entries"  ("patientId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("userId" integer NOT NULL, "roleId" integer NOT NULL, CONSTRAINT "PK_88481b0c4ed9ada47e9fdd67475" PRIMARY KEY ("userId", "roleId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_472b25323af01488f1f66a06b6" ON "user_roles"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86033897c009fcca8b6505d6be" ON "user_roles"  ("roleId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_13c2e57cb81b44f062ba24df57d" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_0c1af27b469cb8dca420c160d65" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" ADD CONSTRAINT "FK_238680c7cf4a83dc020a7c824c5" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD CONSTRAINT "FK_55651e05e46413d510215535edf" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_record_entries" ADD CONSTRAINT "FK_1650639c0e70ae90abe467b0e61" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_record_entries" ADD CONSTRAINT "FK_970a1f42768198137c58a5b1236" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_record_entries" ADD CONSTRAINT "FK_08f717ed6ab0a0fa96a94bdf2ef" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_record_entries" ADD CONSTRAINT "FK_d913288cb1a7de06c6481cdc775" FOREIGN KEY ("correctsEntryId") REFERENCES "medical_record_entries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_472b25323af01488f1f66a06b67"`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_record_entries" DROP CONSTRAINT "FK_d913288cb1a7de06c6481cdc775"`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_record_entries" DROP CONSTRAINT "FK_08f717ed6ab0a0fa96a94bdf2ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_record_entries" DROP CONSTRAINT "FK_970a1f42768198137c58a5b1236"`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_record_entries" DROP CONSTRAINT "FK_1650639c0e70ae90abe467b0e61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" DROP CONSTRAINT "FK_55651e05e46413d510215535edf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_schedules" DROP CONSTRAINT "FK_238680c7cf4a83dc020a7c824c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_0c1af27b469cb8dca420c160d65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_13c2e57cb81b44f062ba24df57d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_86033897c009fcca8b6505d6be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_472b25323af01488f1f66a06b6"`,
    );
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_acc8c825bd03224e81040faedc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08f717ed6ab0a0fa96a94bdf2e"`,
    );
    await queryRunner.query(`DROP TABLE "medical_record_entries"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99b590f24ff602301034311f83"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_525de5c5b6614c4562f49851a7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a4cde6e193d0dbfb9521cc4e70"`,
    );
    await queryRunner.query(`DROP TABLE "logs"`);
    await queryRunner.query(`DROP TYPE "public"."logs_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."logs_entitytype_enum"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_USER_EMAIL"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "doctors"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd584282015842064279b32a3b"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_schedules"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5643f83e97b3c0ca5a5148409"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4698ba259c0dcf0a66a7c5f9e9"`,
    );
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
    await queryRunner.query(`DROP TABLE "patients"`);
  }
}
