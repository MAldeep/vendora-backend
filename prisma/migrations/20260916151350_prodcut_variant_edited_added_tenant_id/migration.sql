/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,sku]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenant_id` to the `product_variants` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "product_variants_sku_key";

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_tenant_id_sku_key" ON "product_variants"("tenant_id", "sku");
