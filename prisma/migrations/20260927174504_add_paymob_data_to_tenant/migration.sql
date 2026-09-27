/*
  Warnings:

  - A unique constraint covering the columns `[paymob_sub_merchant_id]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'PAYMOB', 'COD');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "paymob_onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymob_sub_merchant_id" TEXT,
ADD COLUMN     "preferred_gateway" "PaymentGateway" NOT NULL DEFAULT 'STRIPE';

-- CreateIndex
CREATE UNIQUE INDEX "tenants_paymob_sub_merchant_id_key" ON "tenants"("paymob_sub_merchant_id");
