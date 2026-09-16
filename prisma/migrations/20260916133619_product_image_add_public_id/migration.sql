/*
  Warnings:

  - You are about to drop the column `sort_order` on the `product_images` table. All the data in the column will be lost.
  - Added the required column `public_id` to the `product_images` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_images" DROP COLUMN "sort_order",
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "public_id" TEXT NOT NULL;
