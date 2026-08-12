import { Module } from '@nestjs/common';

// Placeholder module — location CRUD (create/edit store locations) will
// likely belong here once that scope is assigned. GET /api/auth/locations
// (list of locations a user can access) already lives in AuthController
// since it's part of the login/session-context flow.
@Module({})
export class LocationsModule {}
