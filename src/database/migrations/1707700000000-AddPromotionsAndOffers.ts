import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionsAndOffers1707700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(
      `CREATE TYPE "promotion_status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TYPE "offer_status_enum" AS ENUM('active', 'claimed', 'expired')`,
    );

    // Create promotions table
    await queryRunner.query(`
      CREATE TABLE "promotions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "title" character varying NOT NULL,
        "description" text,
        "discountPercentage" numeric(5,2) NOT NULL,
        "store_id" uuid NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "status" "promotion_status_enum" NOT NULL DEFAULT 'active',
        "minPointsRequired" integer,
        CONSTRAINT "PK_promotions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_promotions_store" FOREIGN KEY ("store_id")
          REFERENCES "stores"("id") ON DELETE CASCADE
      )
    `);

    // Create offers table
    await queryRunner.query(`
      CREATE TABLE "offers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "title" character varying NOT NULL,
        "description" text,
        "discountPercentage" numeric(5,2) NOT NULL,
        "user_id" uuid NOT NULL,
        "store_id" uuid NOT NULL,
        "promotion_id" uuid,
        "expiresAt" TIMESTAMP NOT NULL,
        "status" "offer_status_enum" NOT NULL DEFAULT 'active',
        "claimedAt" TIMESTAMP,
        CONSTRAINT "PK_offers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_offers_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_offers_store" FOREIGN KEY ("store_id")
          REFERENCES "stores"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_offers_promotion" FOREIGN KEY ("promotion_id")
          REFERENCES "promotions"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_promotions_store" ON "promotions" ("store_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_promotions_status_dates" ON "promotions" ("status", "startDate", "endDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_offers_user" ON "offers" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_offers_store" ON "offers" ("store_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_offers_status_expires" ON "offers" ("status", "expiresAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_offers_promotion" ON "offers" ("promotion_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_offers_promotion"`);
    await queryRunner.query(`DROP INDEX "IDX_offers_status_expires"`);
    await queryRunner.query(`DROP INDEX "IDX_offers_store"`);
    await queryRunner.query(`DROP INDEX "IDX_offers_user"`);
    await queryRunner.query(`DROP INDEX "IDX_promotions_status_dates"`);
    await queryRunner.query(`DROP INDEX "IDX_promotions_store"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "offers"`);
    await queryRunner.query(`DROP TABLE "promotions"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "offer_status_enum"`);
    await queryRunner.query(`DROP TYPE "promotion_status_enum"`);
  }
}
