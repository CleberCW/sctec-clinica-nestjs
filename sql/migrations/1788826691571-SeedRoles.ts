import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRoles1788826691571 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "role" ("name")
      VALUES
        ('admin'),
        ('user'),
        ('owner')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    DELETE FROM "user_roles_role"
    WHERE "roleId" IN (
      SELECT "id"
      FROM "role"
      WHERE "name" IN ('admin', 'user', 'owner')
    );
  `);
    await queryRunner.query(`
      DELETE FROM "role"
      WHERE "name" IN ('admin', 'user', 'owner')
    `);
  }
}
