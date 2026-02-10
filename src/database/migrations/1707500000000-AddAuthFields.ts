import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthFields1707500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM('user', 'admin')`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD "password" character varying NOT NULL DEFAULT ''`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "user_role_enum" NOT NULL DEFAULT 'user'`,
    );

    // Remove the default on password after adding the column (existing rows get empty string)
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
