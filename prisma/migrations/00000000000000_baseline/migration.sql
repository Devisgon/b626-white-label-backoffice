-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."brands" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."carton_mappings" (
    "id" BIGSERIAL NOT NULL,
    "carton_product_id" BIGINT NOT NULL,
    "child_product_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carton_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "age_restriction" BOOLEAN DEFAULT false,
    "default_margin" DECIMAL,
    "default_tax_rate" DECIMAL,
    "nacs_code" TEXT,
    "pos_department_number" INTEGER,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER,
    "maximum_stock" INTEGER,
    "reorder_level" INTEGER,
    "warehouse" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "available_quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_locations" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_logs" (
    "id" BIGSERIAL NOT NULL,
    "inventory_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_quantity" INTEGER NOT NULL,
    "new_quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_book_items" (
    "id" BIGSERIAL NOT NULL,
    "price_book_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "selling_price" DECIMAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_book_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_books" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_id" BIGINT,
    "action" TEXT,
    "description" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "performed_by" UUID,

    CONSTRAINT "product_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_inventory" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "location_id" BIGINT NOT NULL,
    "on_hand_quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER,
    "minimum_stock" INTEGER,
    "maximum_stock" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "retail_price" DECIMAL,
    "cost" DECIMAL,
    "status" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "category_id" BIGINT,
    "description" TEXT,
    "sale_type" TEXT DEFAULT 'Retail',
    "unit" TEXT DEFAULT 'Piece',
    "size" TEXT,
    "tax" DECIMAL DEFAULT 0,
    "inventory_tracking" BOOLEAN DEFAULT true,
    "minimum_stock" BIGINT DEFAULT 0,
    "maximum_stock" BIGINT DEFAULT 0,
    "brand_id" BIGINT,
    "department_id" BIGINT,
    "item_code" TEXT,
    "supplier_id" BIGINT,
    "is_multi_pack" BOOLEAN NOT NULL DEFAULT false,
    "pack_size" INTEGER,
    "pack_type" TEXT,
    "plu_code" TEXT,
    "wholesale_price" DECIMAL,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."suppliers" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."units" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "status" TEXT DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_locations_code_key" ON "public"."inventory_locations"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "product_inventory_product_id_location_id_key" ON "public"."product_inventory"("product_id" ASC, "location_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "public"."products"("barcode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "products_item_code_key" ON "public"."products"("item_code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "products_plu_code_key" ON "public"."products"("plu_code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku" ASC);

-- AddForeignKey
ALTER TABLE "public"."carton_mappings" ADD CONSTRAINT "carton_mappings_carton_product_id_fkey" FOREIGN KEY ("carton_product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carton_mappings" ADD CONSTRAINT "carton_mappings_child_product_id_fkey" FOREIGN KEY ("child_product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_logs" ADD CONSTRAINT "inventory_logs_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."price_book_items" ADD CONSTRAINT "price_book_items_price_book_id_fkey" FOREIGN KEY ("price_book_id") REFERENCES "public"."price_books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."price_book_items" ADD CONSTRAINT "price_book_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_audit_logs" ADD CONSTRAINT "fk_product_audit_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."product_inventory" ADD CONSTRAINT "product_inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_inventory" ADD CONSTRAINT "product_inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

