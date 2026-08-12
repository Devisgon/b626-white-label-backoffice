import { SetMetadata } from '@nestjs/common';

// Marks a route (or a whole controller) as needing a selected store/branch —
// i.e. the caller's JWT must carry a non-null activeLocationId. Used for
// banking and location-specific inventory routes; tenant-wide master data
// (categories, brands, suppliers...) does not need this.
export const REQUIRE_LOCATION_KEY = 'requireLocation';
export const RequireLocation = () => SetMetadata(REQUIRE_LOCATION_KEY, true);
