-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "check_number" TEXT,
ADD COLUMN     "is_payroll_check" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_printed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "print_batch_id" UUID,
ADD COLUMN     "printed_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "check_print_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "starting_check_number" TEXT NOT NULL,
    "check_count" INTEGER NOT NULL,
    "printed_by" TEXT,
    "printed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_print_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_check_print_batches_tenant_location" ON "check_print_batches"("tenant_id", "location_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_print_batch_id_fkey" FOREIGN KEY ("print_batch_id") REFERENCES "check_print_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
