# Backoffice API — Merged Project

Product (mine) + Auth (Aqsa) + Banking (Hadia) ko ek single NestJS + Prisma
project mein merge kiya gaya hai. Neeche wo sab decisions hain jo merge ke
dauran liye gaye, aur setup ke steps.

## 1. Kya badla

| Area                              | Pehle                                                                                     | Ab                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| NestJS / Prisma version           | Product+Banking: Nest 11 / Prisma 6. Auth: Nest 10 / Prisma 5                             | Sab **Nest 11 / Prisma 6** pe upgrade                                                                            |
| Database                          | 3 alag Supabase projects                                                                  | 1 (product module ka Supabase project — jo aapne bataya)                                                         |
| Prisma schema                     | 3 alag `schema.prisma`                                                                    | 1 unified `prisma/schema.prisma`, koi naming collision nahi                                                      |
| Auth on product/banking routes    | **Public** — koi guard nahi                                                               | `JwtAuthGuard` + `RolesGuard` sab routes pe (except `@Public()` wale: login/register/etc)                        |
| Banking's tenant/location context | Client-supplied `x-tenant-id` / `x-location-id` **headers** — koi bhi spoof kar sakta tha | Verified JWT (`req.user.tenantId` / `req.user.activeLocationId`) se derive hota hai — headers ab trust nahi hote |
| Product/catalogue tenant scoping  | Bilkul nahi tha (global tables)                                                           | `tenant_id` (+ store-specific tables mein `store_location_id`) — automatically enforced                          |

## 2. Security fix (important — please note)

Hadia's banking module ka `TenantLocationGuard` client ke bheje huye
`x-tenant-id` / `x-location-id` headers pe trust karta tha — matlab koi bhi
caller apni marzi se dusre tenant ka data access/modify kar sakta tha, sirf
header change karke. Ye replace kar diya gaya hai `TenantContextGuard` se,
jo tenant/location sirf verified JWT se leta hai. Banking ke services mein
koi code change nahi karna pada — wo already `@Ctx() ctx: RequestContext`
pattern use kar rahe the, sirf guard ne jo context bharta tha wo change hua.

## 3. Product module tenant scoping — approach

Product/catalogue module mein tenant ka concept sirf nahi tha (14
sub-modules). Har service manually edit karne ke bajaye (jahan ek jagah bhi
`tenant_id` filter bhool jaana = cross-tenant data leak), ek
**Prisma Client Extension** likha gaya hai:

- `src/common/context/request-context.store.ts` — `AsyncLocalStorage` jo
  har request ke liye tenant/location/user context hold karta hai.
- `src/common/context/request-context.middleware.ts` — request start pe
  empty store khol deta hai.
- `src/common/guards/tenant-context.guard.ts` — `JwtAuthGuard` ke baad
  chalta hai, verified user se tenant/location nikal ke store mein bharta
  hai.
- `src/prisma/tenant-scoping.extension.ts` — automatically har catalogue
  query (`findMany`, `create`, `update`, `delete`, etc.) mein `tenant_id`
  (aur jahan zaroori ho `store_location_id`) inject kar deta hai.
- `src/prisma/tenant-scoped-models.ts` — explicit allow-list ke models
  (koi bhi naya catalogue model add karo to yahan register karna hoga).

Matlab: koi bhi catalogue query bina tenant context ke chal hi nahi sakti —
structurally impossible, kisi ek forgotten `where` clause pe depend nahi
karta.

**Design choice**: Master data (categories, brands, suppliers, units,
price books...) sirf `tenant_id` se scoped hai — poore tenant mein shared.
Stock/quantity data (`inventory`, `inventory_logs`, `product_inventory`)
`tenant_id` + `store_location_id` dono se — kyunki stock har store ka alag
hota hai. Ye aam POS/backoffice systems ka standard pattern hai.

## 4. Roles

Har controller pe `@Roles(...)` laga diya gaya hai (defaults):

- Banking: `OWNER_ADMIN`, `FINANCE_USER`
- Catalogue: `OWNER_ADMIN`, `STORE_MANAGER`, `INVENTORY_USER`

Ye starting point hai — per-endpoint fine-tune kar sakte hain
(`src/common/decorators/roles.decorator.ts` use karke).

Inventory/product-inventory aur pura banking module `@RequireLocation()`
se marked hai — matlab caller ne pehle `POST /auth/active-location` se
apna store select kiya hona chahiye.

## 5. Setup

```bash
npm install
```

`.env` already bana diya gaya hai (product module ke Supabase project ki
DATABASE_URL/DIRECT_URL, auth module ke JWT secrets, sab merged). **Deploy
se pehle sab secrets rotate karo** — teeno original `.env` files live
credentials ke sath zip mein the.

```bash
# Prisma client generate karo
npx prisma generate

# Naya merged schema database pe apply karo (ye teeno modules ke
# existing tables + naye tenant_id/store_location_id columns add karega)
npx prisma migrate dev --name merge_three_modules
```

⚠️ **`prisma migrate dev` chalane se pehle**: agar product module ki
Supabase DB mein already data hai, to naye `tenant_id` columns `NOT NULL`
hain — pehle un rows ko existing (ya ek default) tenant se backfill karna
hoga, warna migration fail hoga. Options:

1. Fresh DB pe migrate karo (agar abhi test/dev data hai, drop karke fresh
   shuru karo), ya
2. Migration ko do steps mein todo: pehle `tenant_id` ko nullable add
   karke existing rows backfill karo, phir `NOT NULL` constraint lagao.

```bash
npm run start:dev
```

Swagger docs: `http://localhost:3000/api-docs` (username/password `.env`
mein `SWAGGER_USER` / `SWAGGER_PASSWORD` se).

## 6. Login flow (client ke liye)

1. `POST /auth/login` → access + refresh token
2. `POST /auth/active-location` → apna store select karo, naya token milega
   jisme `activeLocationId` encoded hai
3. Ab har request pe `Authorization: Bearer <token>` bhejo — koi
   `x-tenant-id`/`x-location-id` header ki zaroorat nahi, wo ab token se
   automatically aata hai.
