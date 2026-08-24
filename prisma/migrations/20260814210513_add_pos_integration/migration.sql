-- CreateTable
CREATE TABLE "pos_devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "last_sync_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "pos_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_sync_queue_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "pos_device_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_sync_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "pos_device_id" UUID NOT NULL,
    "pos_receipt_number" TEXT NOT NULL,
    "cashier_user_id" TEXT,
    "sale_total" DECIMAL(14,2) NOT NULL,
    "sale_date" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "bank_transaction_id" UUID,
    "raw_payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_pos_devices_tenant_location" ON "pos_devices"("tenant_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_devices_tenant_id_location_id_device_code_key" ON "pos_devices"("tenant_id", "location_id", "device_code");

-- CreateIndex
CREATE INDEX "idx_pos_sync_queue_tenant_location" ON "pos_sync_queue_items"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_pos_sync_queue_device_status" ON "pos_sync_queue_items"("pos_device_id", "status");

-- CreateIndex
CREATE INDEX "idx_pos_sales_tenant_location" ON "pos_sales"("tenant_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_sales_pos_device_id_pos_receipt_number_key" ON "pos_sales"("pos_device_id", "pos_receipt_number");

-- AddForeignKey
ALTER TABLE "pos_sync_queue_items" ADD CONSTRAINT "pos_sync_queue_items_pos_device_id_fkey" FOREIGN KEY ("pos_device_id") REFERENCES "pos_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_pos_device_id_fkey" FOREIGN KEY ("pos_device_id") REFERENCES "pos_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
