/*
  Warnings:

  - You are about to drop the `pos_sales` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pos_sales" DROP CONSTRAINT "pos_sales_pos_device_id_fkey";

-- DropTable
DROP TABLE "pos_sales";
