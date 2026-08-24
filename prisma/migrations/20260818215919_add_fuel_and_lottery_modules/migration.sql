-- CreateTable
CREATE TABLE "fuel_tanks" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "capacity" DECIMAL(10,2) NOT NULL,
    "current_stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "location_id" UUID,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "fuel_tanks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_pumps" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tank_id" BIGINT NOT NULL,
    "location_id" UUID,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "fuel_pumps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_prices" (
    "id" BIGSERIAL NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "price_per_liter" DECIMAL(10,2) NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "location_id" UUID,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "fuel_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_deliveries" (
    "id" BIGSERIAL NOT NULL,
    "tank_id" BIGINT NOT NULL,
    "supplier_name" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "invoice_number" TEXT,
    "delivery_date" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT DEFAULT 'Received',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "fuel_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_sales" (
    "id" BIGSERIAL NOT NULL,
    "pump_id" BIGINT NOT NULL,
    "tank_id" BIGINT NOT NULL,
    "opening_reading" DECIMAL(12,2) NOT NULL,
    "closing_reading" DECIMAL(12,2) NOT NULL,
    "liters_sold" DECIMAL(10,2) NOT NULL,
    "price_per_liter" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "payment_method" TEXT DEFAULT 'cash',
    "shift" TEXT,
    "sale_date" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT DEFAULT 'Completed',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "fuel_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_games" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "game_number" TEXT,
    "ticket_price" DECIMAL(10,2) NOT NULL,
    "tickets_per_pack" INTEGER,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "lottery_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_packs" (
    "id" BIGSERIAL NOT NULL,
    "game_id" BIGINT NOT NULL,
    "pack_number" TEXT NOT NULL,
    "start_ticket_no" INTEGER NOT NULL,
    "end_ticket_no" INTEGER NOT NULL,
    "activated_at" TIMESTAMPTZ(6),
    "location_id" UUID,
    "status" TEXT DEFAULT 'In Stock',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "lottery_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_sales" (
    "id" BIGSERIAL NOT NULL,
    "pack_id" BIGINT NOT NULL,
    "opening_ticket_no" INTEGER NOT NULL,
    "closing_ticket_no" INTEGER NOT NULL,
    "tickets_sold" INTEGER NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "payout_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shift" TEXT,
    "sale_date" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT DEFAULT 'Completed',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "lottery_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_settlements" (
    "id" BIGSERIAL NOT NULL,
    "location_id" UUID,
    "settlement_date" TIMESTAMPTZ(6) NOT NULL,
    "total_sales" DECIMAL(14,2) NOT NULL,
    "total_payouts" DECIMAL(14,2) NOT NULL,
    "net_amount" DECIMAL(14,2) NOT NULL,
    "status" TEXT DEFAULT 'Pending',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "tenant_id" UUID,

    CONSTRAINT "lottery_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_tanks_status_idx" ON "fuel_tanks"("status");

-- CreateIndex
CREATE INDEX "fuel_tanks_deleted_at_idx" ON "fuel_tanks"("deleted_at");

-- CreateIndex
CREATE INDEX "fuel_tanks_tenant_id_idx" ON "fuel_tanks"("tenant_id");

-- CreateIndex
CREATE INDEX "fuel_pumps_status_idx" ON "fuel_pumps"("status");

-- CreateIndex
CREATE INDEX "fuel_pumps_tank_id_idx" ON "fuel_pumps"("tank_id");

-- CreateIndex
CREATE INDEX "fuel_pumps_deleted_at_idx" ON "fuel_pumps"("deleted_at");

-- CreateIndex
CREATE INDEX "fuel_pumps_tenant_id_idx" ON "fuel_pumps"("tenant_id");

-- CreateIndex
CREATE INDEX "fuel_prices_fuel_type_idx" ON "fuel_prices"("fuel_type");

-- CreateIndex
CREATE INDEX "fuel_prices_status_idx" ON "fuel_prices"("status");

-- CreateIndex
CREATE INDEX "fuel_prices_deleted_at_idx" ON "fuel_prices"("deleted_at");

-- CreateIndex
CREATE INDEX "fuel_prices_tenant_id_idx" ON "fuel_prices"("tenant_id");

-- CreateIndex
CREATE INDEX "fuel_deliveries_tank_id_idx" ON "fuel_deliveries"("tank_id");

-- CreateIndex
CREATE INDEX "fuel_deliveries_status_idx" ON "fuel_deliveries"("status");

-- CreateIndex
CREATE INDEX "fuel_deliveries_deleted_at_idx" ON "fuel_deliveries"("deleted_at");

-- CreateIndex
CREATE INDEX "fuel_deliveries_tenant_id_idx" ON "fuel_deliveries"("tenant_id");

-- CreateIndex
CREATE INDEX "fuel_sales_pump_id_idx" ON "fuel_sales"("pump_id");

-- CreateIndex
CREATE INDEX "fuel_sales_tank_id_idx" ON "fuel_sales"("tank_id");

-- CreateIndex
CREATE INDEX "fuel_sales_status_idx" ON "fuel_sales"("status");

-- CreateIndex
CREATE INDEX "fuel_sales_sale_date_idx" ON "fuel_sales"("sale_date");

-- CreateIndex
CREATE INDEX "fuel_sales_deleted_at_idx" ON "fuel_sales"("deleted_at");

-- CreateIndex
CREATE INDEX "fuel_sales_tenant_id_idx" ON "fuel_sales"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lottery_games_game_number_key" ON "lottery_games"("game_number");

-- CreateIndex
CREATE INDEX "lottery_games_status_idx" ON "lottery_games"("status");

-- CreateIndex
CREATE INDEX "lottery_games_deleted_at_idx" ON "lottery_games"("deleted_at");

-- CreateIndex
CREATE INDEX "lottery_games_tenant_id_idx" ON "lottery_games"("tenant_id");

-- CreateIndex
CREATE INDEX "lottery_packs_game_id_idx" ON "lottery_packs"("game_id");

-- CreateIndex
CREATE INDEX "lottery_packs_status_idx" ON "lottery_packs"("status");

-- CreateIndex
CREATE INDEX "lottery_packs_deleted_at_idx" ON "lottery_packs"("deleted_at");

-- CreateIndex
CREATE INDEX "lottery_packs_tenant_id_idx" ON "lottery_packs"("tenant_id");

-- CreateIndex
CREATE INDEX "lottery_sales_pack_id_idx" ON "lottery_sales"("pack_id");

-- CreateIndex
CREATE INDEX "lottery_sales_status_idx" ON "lottery_sales"("status");

-- CreateIndex
CREATE INDEX "lottery_sales_sale_date_idx" ON "lottery_sales"("sale_date");

-- CreateIndex
CREATE INDEX "lottery_sales_deleted_at_idx" ON "lottery_sales"("deleted_at");

-- CreateIndex
CREATE INDEX "lottery_sales_tenant_id_idx" ON "lottery_sales"("tenant_id");

-- CreateIndex
CREATE INDEX "lottery_settlements_status_idx" ON "lottery_settlements"("status");

-- CreateIndex
CREATE INDEX "lottery_settlements_settlement_date_idx" ON "lottery_settlements"("settlement_date");

-- CreateIndex
CREATE INDEX "lottery_settlements_deleted_at_idx" ON "lottery_settlements"("deleted_at");

-- CreateIndex
CREATE INDEX "lottery_settlements_tenant_id_idx" ON "lottery_settlements"("tenant_id");

-- AddForeignKey
ALTER TABLE "fuel_pumps" ADD CONSTRAINT "fuel_pumps_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "fuel_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_deliveries" ADD CONSTRAINT "fuel_deliveries_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "fuel_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_sales" ADD CONSTRAINT "fuel_sales_pump_id_fkey" FOREIGN KEY ("pump_id") REFERENCES "fuel_pumps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_sales" ADD CONSTRAINT "fuel_sales_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "fuel_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_packs" ADD CONSTRAINT "lottery_packs_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "lottery_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_sales" ADD CONSTRAINT "lottery_sales_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "lottery_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
