/*
  Warnings:

  - You are about to drop the `pos_devices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pos_sync_queue_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pos_sync_queue_items" DROP CONSTRAINT "pos_sync_queue_items_pos_device_id_fkey";

-- DropTable
DROP TABLE "pos_devices";

-- DropTable
DROP TABLE "pos_sync_queue_items";
