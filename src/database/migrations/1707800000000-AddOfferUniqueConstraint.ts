import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOfferUniqueConstraint1707800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove existing duplicates — keep only the newest offer per user per promotion
    await queryRunner.query(`
      DELETE FROM "offers" WHERE "id" IN (
        SELECT "id" FROM (
          SELECT "id", ROW_NUMBER() OVER (
            PARTITION BY "user_id", "promotion_id"
            ORDER BY "createdAt" DESC
          ) as rn
          FROM "offers"
          WHERE "status" IN ('active', 'claimed')
        ) ranked WHERE rn > 1
      )
    `);

    // Add partial unique index: 1 active/claimed offer per user per promotion
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_offers_user_promotion_active_claimed"
      ON "offers" ("user_id", "promotion_id")
      WHERE "status" IN ('active', 'claimed')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_offers_user_promotion_active_claimed"`,
    );
  }
}
