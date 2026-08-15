## Backoffice API — Merged Project

Product (mine) + Auth (Aqsa) + Banking (Hadia) have been merged into a single NestJS + Prisma project. Below are all the decisions made during the merge and the setup steps.

### 1. What Changed

| Area                             | Before                                                                     | Now                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| NestJS / Prisma version          | Product + Banking: Nest 11 / Prisma 6; Auth: Nest 10 / Prisma 5            | All upgraded to **Nest 11 / Prisma 6**                                                                            |
| Database                         | 3 separate Supabase projects                                               | 1 Supabase project — the Product module's Supabase project                                                        |
| Prisma schema                    | 3 separate `schema.prisma` files                                           | 1 unified `prisma/schema.prisma` with no naming collisions                                                        |
| Auth on product/banking routes   | **Public** — no guards                                                     | `JwtAuthGuard` + `RolesGuard` on all routes except `@Public()` routes such as login/register                      |
| Banking tenant/location context  | Client-supplied `x-tenant-id` / `x-location-id` headers — could be spoofed | Derived from the verified JWT (`req.user.tenantId` / `req.user.activeLocationId`) — headers are no longer trusted |
| Product/catalogue tenant scoping | No tenant scoping — global tables                                          | `tenant_id` plus `store_location_id` for store-specific tables — automatically enforced                           |

### 2. Security Fix — Important

Hadia's Banking module previously used `TenantLocationGuard`, which trusted the `x-tenant-id` / `x-location-id` headers sent by the client. This meant that anyone could potentially access or modify another tenant's data simply by changing these headers.

This has been replaced with `TenantContextGuard`, which gets the tenant and location information only from the **verified JWT**.

No changes were required in the Banking services because they already use the `@Ctx() ctx: RequestContext` pattern. Only the guard responsible for populating the context was changed.

### 3. Product Module Tenant Scoping — Approach

The Product/Catalogue module previously did not have a tenant concept across its 14 sub-modules. Instead of manually modifying every service, a **Prisma Client Extension** was implemented.

The following components were added:

* `src/common/context/request-context.store.ts` — Uses `AsyncLocalStorage` to hold the tenant, location, and user context for each request.
* `src/common/context/request-context.middleware.ts` — Creates an empty context store when a request starts.
* `src/common/guards/tenant-context.guard.ts` — Runs after `JwtAuthGuard`, retrieves the tenant/location from the verified user, and stores it in the request context.
* `src/prisma/tenant-scoping.extension.ts` — Automatically injects `tenant_id` and, where required, `store_location_id` into Catalogue Prisma operations such as `findMany`, `create`, `update`, `delete`, etc.
* `src/prisma/tenant-scoped-models.ts` — Contains an explicit allow-list of models that should be tenant-scoped. Any new Catalogue model must be registered here.

This means that Catalogue queries cannot run without a valid tenant context. The system does not rely on developers remembering to add a `where` clause every time, which reduces the risk of accidental cross-tenant data access.

**Design choice:** Master data such as categories, brands, suppliers, units, and price books is scoped only by `tenant_id`, meaning it is shared across the entire tenant.

Stock/quantity-related data such as `inventory`, `inventory_logs`, and `product_inventory` is scoped by both `tenant_id` and `store_location_id`, because inventory is maintained separately for each store.

This is a common pattern for POS/backoffice systems.

### 4. Roles

`@Roles(...)` has been added to each controller with the following default roles:

* **Banking:** `OWNER_ADMIN`, `FINANCE_USER`
* **Catalogue:** `OWNER_ADMIN`, `STORE_MANAGER`, `INVENTORY_USER`

These are starting defaults and can be fine-tuned per endpoint using:

`src/common/decorators/roles.decorator.ts`

The Inventory/Product Inventory modules and the entire Banking module are marked with `@RequireLocation()`.

This means the caller must first select a store using:

`POST /auth/active-location`

### 5. Setup

Run:

```bash
npm install
```

The `.env` file has already been created with the Product module's Supabase `DATABASE_URL`/`DIRECT_URL` and the Auth module's JWT secrets.

**Before deploying, rotate all secrets.** The three original `.env` files contained live credentials and were included in the ZIP files.

Generate the Prisma client:

```bash
npx prisma generate
```

Then apply the merged schema to the database:

```bash
npx prisma migrate dev --name merge_three_modules
```

⚠️ **Important:** Before running `prisma migrate dev`, check whether the Product module's Supabase database already contains data.

The new `tenant_id` columns are `NOT NULL`. Existing rows must therefore be assigned to an existing tenant or a default tenant before the migration can succeed.

There are two options:

1. **Fresh database:** If the existing data is only test/development data, drop the database and start fresh.
2. **Existing data:** Split the migration into two steps:

   * First add `tenant_id` as nullable.
   * Backfill the existing rows with the appropriate tenant.
   * Then change `tenant_id` to `NOT NULL`.

Start the application:

```bash
npm run start:dev
```

Swagger documentation is available at:

`http://localhost:3000/api-docs`

The Swagger username and password are configured in `.env` using:

```env
SWAGGER_USER
SWAGGER_PASSWORD
```

### 6. Login Flow for the Client

1. `POST /auth/login` → Returns an access token and refresh token.
2. `POST /auth/active-location` → Select the user's store. A new token is returned containing `activeLocationId`.
3. Send the new token with every request:

```http
Authorization: Bearer <token>
```

There is **no need to send** `x-tenant-id` or `x-location-id` headers anymore. The tenant and active location are automatically derived from the verified JWT.
