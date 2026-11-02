import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1792717836478 implements MigrationInterface {
  name = 'Migration1792717836478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."roles_name_enum" RENAME TO "roles_name_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."roles_name_enum" AS ENUM('ADMIN', 'SECRETARY', 'DOCTOR')`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "name" TYPE "public"."roles_name_enum" USING "name"::"text"::"public"."roles_name_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."roles_name_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."roles_name_enum_old" AS ENUM('admin', 'secretary', 'doctor')`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "name" TYPE "public"."roles_name_enum_old" USING "name"::"text"::"public"."roles_name_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."roles_name_enum_old" RENAME TO "roles_name_enum"`,
    );
  }
}
