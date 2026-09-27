/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,user_id]` on the table `carts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,session_id]` on the table `carts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_checkout_session_id]` on the table `master_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_payment_intent_id]` on the table `master_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_transfer_id]` on the table `tenant_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_account_id]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "categories_slug_key";

-- DropIndex
DROP INDEX "products_sku_key";

-- AlterTable
ALTER TABLE "master_orders" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EGP',
ADD COLUMN     "stripe_checkout_session_id" TEXT,
ADD COLUMN     "stripe_payment_intent_id" TEXT,
ALTER COLUMN "payment_gateway" SET DEFAULT 'STRIPE';

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "sku" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tenant_orders" ADD COLUMN     "application_fee" DECIMAL(10,2),
ADD COLUMN     "net_amount" DECIMAL(10,2),
ADD COLUMN     "stripe_transfer_id" TEXT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "stripe_account_id" TEXT,
ADD COLUMN     "stripe_charges_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripe_payouts_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "master_order_id" TEXT,
    "tenant_id" TEXT,
    "stripe_account_id" TEXT,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "amount" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'EGP',
    "status" TEXT NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_event_id_key" ON "payment_transactions"("event_id");

-- CreateIndex
CREATE INDEX "payment_transactions_master_order_id_idx" ON "payment_transactions"("master_order_id");

-- CreateIndex
CREATE INDEX "payment_transactions_tenant_id_idx" ON "payment_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_transactions_event_id_idx" ON "payment_transactions"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_tenant_id_user_id_key" ON "carts"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_tenant_id_session_id_key" ON "carts"("tenant_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_orders_stripe_checkout_session_id_key" ON "master_orders"("stripe_checkout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_orders_stripe_payment_intent_id_key" ON "master_orders"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "master_orders_user_id_idx" ON "master_orders"("user_id");

-- CreateIndex
CREATE INDEX "master_orders_stripe_payment_intent_id_idx" ON "master_orders"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "order_items_tenant_order_id_idx" ON "order_items"("tenant_order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_sku_key" ON "products"("tenant_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_orders_stripe_transfer_id_key" ON "tenant_orders"("stripe_transfer_id");

-- CreateIndex
CREATE INDEX "tenant_orders_master_order_id_idx" ON "tenant_orders"("master_order_id");

-- CreateIndex
CREATE INDEX "tenant_orders_tenant_id_idx" ON "tenant_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_user_roles_tenant_id_idx" ON "tenant_user_roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripe_account_id_key" ON "tenants"("stripe_account_id");

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_master_order_id_fkey" FOREIGN KEY ("master_order_id") REFERENCES "master_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
