import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultRoles1792717933461 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "roles" (name) VALUES ('ADMIN'), ('SECRETARY'), ('DOCTOR') ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "roles" WHERE name IN ('ADMIN', 'SECRETARY', 'DOCTOR')`,
    );
  }
}
