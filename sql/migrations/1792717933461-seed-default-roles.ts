import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultRoles1792717933461 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insere as 3 funções obrigatórias. O ON CONFLICT impede erros caso já existam.
    await queryRunner.query(
      `INSERT INTO "roles" (name) VALUES ('ADMIN'), ('SECRETARY'), ('DOCTOR') ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove as funções se você der um rollback na migration
    await queryRunner.query(
      `DELETE FROM "roles" WHERE name IN ('ADMIN', 'SECRETARY', 'DOCTOR')`,
    );
  }
}
