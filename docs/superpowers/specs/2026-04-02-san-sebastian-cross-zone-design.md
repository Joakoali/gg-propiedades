# San Sebastián Cross-Zone Filter

**Date:** 2026-04-02

## Problem

San Sebastián is a neighborhood shared between the Pilar and Escobar zones. Properties in San Sebastián are stored in the database with `zone="Pilar"` or `zone="Escobar"` and `neighborhood="San Sebastián"`.

The current filter only matches on the `zone` field, so:
- Filtering by Pilar shows San Sebastián properties with `zone="Pilar"` but misses those with `zone="Escobar"`.
- Filtering by Escobar shows San Sebastián properties with `zone="Escobar"` but misses those with `zone="Pilar"`.

The client requires that filtering by either Pilar or Escobar returns **all** San Sebastián properties regardless of which zone they are stored under.

## Solution — Option A: `CROSS_ZONE_NEIGHBORHOODS` constant

Two files are touched. No data migration required. Works for existing and future properties.

### 1. `app/lib/utils.ts`

Add a new exported constant below `ZONE_FILTER_MAP`:

```typescript
export const CROSS_ZONE_NEIGHBORHOODS: Record<string, string[]> = {
  "Pilar":   ["San Sebastián"],
  "Escobar": ["San Sebastián"],
};
```

This declares that "San Sebastián" belongs conceptually to both zones. `ZONES` and `ZONE_FILTER_MAP` are not modified.

### 2. `app/lib/public-properties.ts`

Extend the zone filter block (currently lines 139-143) to also OR on the `neighborhood` field:

```typescript
if (filters.zone) {
  const dbZones = ZONE_FILTER_MAP[filters.zone] ?? [filters.zone];
  const crossNeighborhoods = CROSS_ZONE_NEIGHBORHOODS[filters.zone] ?? [];

  const conditions = [
    ...dbZones.map((z) => `zone.eq.${z}`),
    ...crossNeighborhoods.map((n) => `neighborhood.ilike.%${n}%`),
  ];

  nextQuery = nextQuery.or(conditions.join(","));
}
```

### Resulting query when filtering by Escobar

```
zone.eq.Escobar OR zone.eq.San Sebastián OR neighborhood.ilike.%San Sebastián%
```

This captures:
- All Escobar-zone properties
- Legacy properties with `zone="San Sebastián"` (if any exist)
- Properties with `zone="Pilar"` and `neighborhood="San Sebastián"` — the previously missing case

The same logic applies symmetrically when filtering by Pilar.

## Scope

- San Sebastián is the only cross-zone neighborhood in the system. The `CROSS_ZONE_NEIGHBORHOODS` map is extensible if others arise in the future.
- No changes to the admin form, database schema, or other filters.
