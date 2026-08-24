// Type-only definitions for the Auth module (src/modules/auth).
// DTO classes (with class-validator decorators for runtime request-body
// validation) stay in src/modules/auth/dto/ — this file is only for plain
// TypeScript shapes used for compile-time typing (no validation, no
// runtime cost).

// Shape of the JWT payload (both access and refresh tokens) — signed in
// AuthService.issueTokens() and read back in JwtStrategy.validate().
export interface JwtPayload {
  sub: string; // user id
  tenantId: string;
  role: string;
  activeLocationId: string | null;
}