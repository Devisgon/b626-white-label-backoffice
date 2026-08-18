-- CreateTable
CREATE TABLE "pos_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'verifone_ruby_ci',
    "site_name" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "external_site_id" TEXT NOT NULL,
    "connection_mode" TEXT NOT NULL DEFAULT 'file_xml',
    "commander_release" TEXT,
    "notes" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "disabled_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "pos_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "pos_connection_id" UUID NOT NULL,
    "internal_entity_type" TEXT NOT NULL,
    "internal_entity_id" TEXT NOT NULL,
    "external_entity_type" TEXT NOT NULL,
    "external_entity_key" TEXT NOT NULL,
    "external_parent_key" TEXT,
    "external_display_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unresolved',
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "pos_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_outbound_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "pos_connection_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "pos_outbound_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_outbound_batch_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID NOT NULL,
    "mapping_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_outbound_batch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_inbound_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "pos_connection_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_inbound_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "pos_connection_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "description" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_pos_connections_tenant_location" ON "pos_connections"("tenant_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_connections_tenant_id_location_id_key" ON "pos_connections"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_pos_mappings_tenant_location" ON "pos_mappings"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_pos_mappings_connection_status" ON "pos_mappings"("pos_connection_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pos_mappings_pos_connection_id_internal_entity_type_interna_key" ON "pos_mappings"("pos_connection_id", "internal_entity_type", "internal_entity_id");

-- CreateIndex
CREATE INDEX "idx_pos_outbound_batches_tenant_location" ON "pos_outbound_batches"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_pos_outbound_items_batch" ON "pos_outbound_batch_items"("batch_id");

-- CreateIndex
CREATE INDEX "idx_pos_inbound_batches_tenant_location" ON "pos_inbound_batches"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_pos_events_connection_date" ON "pos_events"("pos_connection_id", "created_at");

-- AddForeignKey
ALTER TABLE "pos_mappings" ADD CONSTRAINT "pos_mappings_pos_connection_id_fkey" FOREIGN KEY ("pos_connection_id") REFERENCES "pos_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_outbound_batches" ADD CONSTRAINT "pos_outbound_batches_pos_connection_id_fkey" FOREIGN KEY ("pos_connection_id") REFERENCES "pos_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_outbound_batch_items" ADD CONSTRAINT "pos_outbound_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "pos_outbound_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_inbound_batches" ADD CONSTRAINT "pos_inbound_batches_pos_connection_id_fkey" FOREIGN KEY ("pos_connection_id") REFERENCES "pos_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_events" ADD CONSTRAINT "pos_events_pos_connection_id_fkey" FOREIGN KEY ("pos_connection_id") REFERENCES "pos_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
