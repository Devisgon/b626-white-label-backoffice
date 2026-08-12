// Shim: the banking module (copied from the standalone banking-backoffice
// service) imports PrismaService from `../../../config/prisma.service`.
// We keep a single real PrismaService (with the tenant-scoping extension)
// in src/prisma/, registered globally by PrismaModule, and just re-export
// it here so those import paths keep working without editing every
// banking service file.
export { PrismaService } from '../prisma/prisma.service';
