import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1707400000000 implements MigrationInterface {
  name = 'InitialSchema1707400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(
      `CREATE TYPE "product_status_enum" AS ENUM('approved', 'pending', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "receipt_status_enum" AS ENUM('processed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "review_request_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );

    // Create stores table
    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid() ,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "location" character varying,
        CONSTRAINT "PK_stores" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "pointsBalance" integer NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "identifier" character varying,
        "pointsValue" integer NOT NULL DEFAULT 0,
        "status" "product_status_enum" NOT NULL DEFAULT 'pending',
        CONSTRAINT "UQ_products_name" UNIQUE ("name"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);

    // Create receipts table
    await queryRunner.query(`
      CREATE TABLE "receipts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "receipt_hash" character varying(64) NOT NULL,
        "receipt_url" text NOT NULL,
        "raw_data" text,
        "store_id" uuid NOT NULL,
        "receipt_date" TIMESTAMP NOT NULL,
        "total_amount" numeric(10,2) NOT NULL,
        "scanned_by_id" uuid NOT NULL,
        "status" "receipt_status_enum" NOT NULL DEFAULT 'processed',
        CONSTRAINT "UQ_receipts_hash" UNIQUE ("receipt_hash"),
        CONSTRAINT "PK_receipts" PRIMARY KEY ("id")
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "store_id" uuid NOT NULL,
        "receipt_id" uuid NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "totalAmount" numeric(10,2) NOT NULL,
        "pointsEarned" integer NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_transactions_receipt" UNIQUE ("receipt_id"),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
      )
    `);

    // Create transaction_items table
    await queryRunner.query(`
      CREATE TABLE "transaction_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "transaction_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "productName" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "totalPrice" numeric(10,2) NOT NULL,
        "pointsAwarded" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_transaction_items" PRIMARY KEY ("id")
      )
    `);

    // Create review_requests table
    await queryRunner.query(`
      CREATE TABLE "review_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "product_id" uuid NOT NULL,
        "submitted_by_id" uuid NOT NULL,
        "status" "review_request_status_enum" NOT NULL DEFAULT 'pending',
        "comment" character varying,
        CONSTRAINT "PK_review_requests" PRIMARY KEY ("id")
      )
    `);

    // Create user_favorite_stores join table
    await queryRunner.query(`
      CREATE TABLE "user_favorite_stores" (
        "usersId" uuid NOT NULL,
        "storesId" uuid NOT NULL,
        CONSTRAINT "PK_user_favorite_stores" PRIMARY KEY ("usersId", "storesId")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "receipts"
      ADD CONSTRAINT "FK_receipts_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "receipts"
      ADD CONSTRAINT "FK_receipts_scanned_by" FOREIGN KEY ("scanned_by_id") REFERENCES "users"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "FK_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "FK_transactions_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "FK_transactions_receipt" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transaction_items"
      ADD CONSTRAINT "FK_transaction_items_transaction" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "transaction_items"
      ADD CONSTRAINT "FK_transaction_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "review_requests"
      ADD CONSTRAINT "FK_review_requests_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "review_requests"
      ADD CONSTRAINT "FK_review_requests_user" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_favorite_stores"
      ADD CONSTRAINT "FK_user_favorite_stores_user" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "user_favorite_stores"
      ADD CONSTRAINT "FK_user_favorite_stores_store" FOREIGN KEY ("storesId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_user_favorite_stores_user" ON "user_favorite_stores" ("usersId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_favorite_stores_store" ON "user_favorite_stores" ("storesId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_favorite_stores_store"`);
    await queryRunner.query(`DROP INDEX "IDX_user_favorite_stores_user"`);
    await queryRunner.query(`DROP TABLE "user_favorite_stores"`);
    await queryRunner.query(`DROP TABLE "review_requests"`);
    await queryRunner.query(`DROP TABLE "transaction_items"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "receipts"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "stores"`);
    await queryRunner.query(`DROP TYPE "review_request_status_enum"`);
    await queryRunner.query(`DROP TYPE "receipt_status_enum"`);
    await queryRunner.query(`DROP TYPE "product_status_enum"`);
  }
}
