import { PrismaClient } from '@prisma/client';

/**
 * Type/injection-token placeholder. The real, connected, tenant-scoped
 * client is constructed by PrismaModule's factory provider (see
 * prisma.module.ts) — Nest's DI matches by this class token, so every
 * `constructor(private readonly prisma: PrismaService)` across the app
 * (catalogue, banking, auth services alike) transparently receives the
 * extended client without any of those files needing to change.
 */
export class PrismaService extends PrismaClient {}
