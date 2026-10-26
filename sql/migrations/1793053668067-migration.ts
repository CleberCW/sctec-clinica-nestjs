import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793053668067 implements MigrationInterface {
    name = 'Migration1793053668067'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "name" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "lastName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "firstName" character varying(100) NOT NULL`);
    }

}
