import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793403963736 implements MigrationInterface {
    name = 'Migration1793403963736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record_entries" RENAME COLUMN "content" TO "text"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record_entries" RENAME COLUMN "text" TO "content"`);
    }

}
