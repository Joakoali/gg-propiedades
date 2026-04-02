# San Sebastián Cross-Zone Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user filters by Pilar or Escobar, all properties with `neighborhood="San Sebastián"` appear — regardless of which zone they are stored under.

**Architecture:** Add a `CROSS_ZONE_NEIGHBORHOODS` constant to `utils.ts` that maps display zones to cross-zone neighborhood names. Extend the `applyFilters` function in `public-properties.ts` to OR on `neighborhood.ilike` for those neighborhoods alongside the existing zone conditions.

**Tech Stack:** TypeScript, Next.js, Supabase (PostgREST `.or()` filter syntax)

---

## Files Modified

- **Modify:** `app/lib/utils.ts` — add `CROSS_ZONE_NEIGHBORHOODS` export after line 48
- **Modify:** `app/lib/public-properties.ts` — update import (line 3) and `applyFilters` zone block (lines 139-143)

---

### Task 1: Add `CROSS_ZONE_NEIGHBORHOODS` to `utils.ts`

**Files:**
- Modify: `app/lib/utils.ts:48`

- [ ] **Step 1: Add the constant**

Open `app/lib/utils.ts`. After line 48 (closing `};` of `ZONE_FILTER_MAP`), add:

```typescript
// ── Barrios que cruzan zonas: se muestran en ambas zonas ──
// San Sebastián está entre Pilar y Escobar; al filtrar cualquiera de las dos
// se incluyen todas las propiedades cuyo neighborhood contenga "San Sebastián".
export const CROSS_ZONE_NEIGHBORHOODS: Record<string, string[]> = {
  "Pilar":   ["San Sebastián"],
  "Escobar": ["San Sebastián"],
};
```

The file around that area should look like this after the edit:

```typescript
export const ZONE_FILTER_MAP: Record<string, string[]> = {
  "Pilar":                 ["Pilar", "La Cañada", "San Sebastián"],
  "Escobar":               ["Escobar", "San Sebastián"],
  "Cardales":              ["Cardales", "Campana"],
  "Exaltación de la Cruz": ["Exaltación de la Cruz"],
};

// ── Barrios que cruzan zonas: se muestran en ambas zonas ──
// San Sebastián está entre Pilar y Escobar; al filtrar cualquiera de las dos
// se incluyen todas las propiedades cuyo neighborhood contenga "San Sebastián".
export const CROSS_ZONE_NEIGHBORHOODS: Record<string, string[]> = {
  "Pilar":   ["San Sebastián"],
  "Escobar": ["San Sebastián"],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/lib/utils.ts
git commit -m "feat: add CROSS_ZONE_NEIGHBORHOODS constant for San Sebastián cross-zone support"
```

---

### Task 2: Extend zone filter in `public-properties.ts`

**Files:**
- Modify: `app/lib/public-properties.ts:3` (import)
- Modify: `app/lib/public-properties.ts:139-143` (filter block)

- [ ] **Step 1: Update the import on line 3**

Change:

```typescript
import { ZONE_FILTER_MAP, ZONES } from "@/app/lib/utils";
```

To:

```typescript
import { CROSS_ZONE_NEIGHBORHOODS, ZONE_FILTER_MAP, ZONES } from "@/app/lib/utils";
```

- [ ] **Step 2: Replace the zone filter block (lines 139-143)**

Change:

```typescript
  if (filters.zone) {
    const dbZones = ZONE_FILTER_MAP[filters.zone] ?? [filters.zone];
    const orFilter = dbZones.map((z) => `zone.eq.${z}`).join(",");
    nextQuery = nextQuery.or(orFilter);
  }
```

To:

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

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/lib/public-properties.ts
git commit -m "feat: include cross-zone neighborhoods in zone filter (San Sebastián)"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify Escobar shows all San Sebastián properties**

Navigate to `/propiedades?zone=Escobar`.

Expected: properties with `zone="Pilar"` AND `neighborhood="San Sebastián"` appear in the results alongside regular Escobar properties.

- [ ] **Step 3: Verify Pilar shows all San Sebastián properties**

Navigate to `/propiedades?zone=Pilar`.

Expected: properties with `zone="Escobar"` AND `neighborhood="San Sebastián"` appear in the results alongside regular Pilar properties.

- [ ] **Step 4: Verify Cardales is not affected**

Navigate to `/propiedades?zone=Cardales`.

Expected: no San Sebastián properties appear (they belong to Pilar/Escobar only).

- [ ] **Step 5: Verify no-zone browse is not affected**

Navigate to `/propiedades` (no zone filter).

Expected: all properties appear as usual, nothing broken.
