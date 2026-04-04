# Dead Code Cleanup + React Query (Admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead code from `r2.ts` and `public-properties.ts`, eliminate a duplicate constant, then wire `@tanstack/react-query` into the admin section so all data fetching and mutations use `useQuery`/`useMutation` with automatic cache invalidation.

**Architecture:** A single `QueryClient` is created in `Providers.tsx` and provided via `QueryClientProvider`. All admin components use the shared query key `['admin-properties']`. Mutations call `queryClient.invalidateQueries` on success, eliminating manual `setProperties` state management. Public pages and API routes are not touched.

**Tech Stack:** Next.js 16 (App Router), `@tanstack/react-query` v5, TypeScript, Supabase, next-auth.

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `app/lib/r2.ts` | Modify | Delete `uploadToR2()` (lines 126–188) |
| `app/lib/public-properties.ts` | Modify | Delete `getCachedZones()` (lines 219–221) |
| `app/propiedades/page.tsx` | Modify | Replace `getCachedZones()` call with direct `ZONES` import |
| `package.json` | Modify | Add `@tanstack/react-query` |
| `app/components/Providers.tsx` | Modify | Add `QueryClientProvider` wrapping `SessionProvider` |
| `app/admin/PropertyList.tsx` | Modify | `useQuery` for fetch, `useMutation` for delete, `invalidateQueries` for toggle |
| `app/admin/properties/[slug]/edit/EditPropertyForm.tsx` | Modify | `useMutation` for final PUT save |
| `app/admin/properties/new/page.tsx` | Modify | `useMutation` for final POST save |

---

## Task 1: Remove dead code from `app/lib/r2.ts`

**Files:**
- Modify: `app/lib/r2.ts`

`uploadToR2()` (lines 126–188) was the only consumer of the direct-upload path. That path (`app/api/upload/route.ts`) was deleted. Only `generatePresignedPutUrl()` is still used.

- [ ] **Step 1: Delete `uploadToR2` from `app/lib/r2.ts`**

Open `app/lib/r2.ts`. Delete everything from line 126 to the end of the file (the entire `uploadToR2` export). The file should end after the closing `}` of `generatePresignedPutUrl` on what is currently line 124.

The final line of the file after the edit should be:

```ts
  };
}
```

(the closing brace of `generatePresignedPutUrl`).

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors related to `r2.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/lib/r2.ts
git commit -m "chore: remove dead uploadToR2 function from r2.ts"
```

---

## Task 2: Remove `getCachedZones` and deduplicate `CATEGORY_LABELS`

**Files:**
- Modify: `app/lib/public-properties.ts`
- Modify: `app/propiedades/page.tsx`
- Modify: `app/admin/PropertyList.tsx`

- [ ] **Step 1: Delete `getCachedZones` from `app/lib/public-properties.ts`**

Remove the following three lines (currently lines 219–221):

```ts
export async function getCachedZones(): Promise<string[]> {
  return ZONES;
}
```

- [ ] **Step 2: Update `app/propiedades/page.tsx` — replace the call with a direct import**

In `app/propiedades/page.tsx`, find the import at the top:

```ts
import {
  getCachedPropertyList,
  getCachedZones,
} from "@/app/lib/public-properties";
```

Replace with:

```ts
import { getCachedPropertyList } from "@/app/lib/public-properties";
import { ZONES } from "@/app/lib/utils";
```

Then find the `Promise.all` call in the page body:

```ts
const [listData, zoneList] = await Promise.all([
  getCachedPropertyList(
    { category, zone, q, minPrice, maxPrice, minBedrooms, pool, financing, mortgageEligible, sort },
    currentPage,
  ),
  getCachedZones(),
]);
```

Replace with:

```ts
const listData = await getCachedPropertyList(
  { category, zone, q, minPrice, maxPrice, minBedrooms, pool, financing, mortgageEligible, sort },
  currentPage,
);
const zoneList = ZONES;
```

- [ ] **Step 3: Remove duplicate `CATEGORY_LABELS` from `app/admin/PropertyList.tsx`**

Find and delete these lines near the top of `app/admin/PropertyList.tsx`:

```ts
const CATEGORY_LABELS: Record<string, string> = {
  houses: "Casa",
  lots:   "Terreno",
  local:  "Local",
};
```

Then update the import line at the top of the file. Currently it imports from utils:

```ts
import { toggleFeatured } from "@/app/actions/featured";
import { MAX_FEATURED } from "@/app/lib/utils";
```

Change to:

```ts
import { toggleFeatured } from "@/app/actions/featured";
import { CATEGORY_LABELS, MAX_FEATURED } from "@/app/lib/utils";
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/lib/public-properties.ts app/propiedades/page.tsx app/admin/PropertyList.tsx
git commit -m "chore: remove getCachedZones and deduplicate CATEGORY_LABELS"
```

---

## Task 3: Install React Query and add QueryClientProvider

**Files:**
- Modify: `package.json` (via npm)
- Modify: `app/components/Providers.tsx`

- [ ] **Step 1: Install `@tanstack/react-query`**

```bash
npm install @tanstack/react-query
```

Expected: package added to `dependencies` in `package.json`.

- [ ] **Step 2: Rewrite `app/components/Providers.tsx`**

Replace the entire file content with:

```tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app/components/Providers.tsx
git commit -m "feat: install @tanstack/react-query and add QueryClientProvider"
```

---

## Task 4: Migrate PropertyList to useQuery + useMutation

**Files:**
- Modify: `app/admin/PropertyList.tsx`

This is the main migration. We replace the manual `useEffect`/`useState`/`fetchProperties` pattern with `useQuery`, replace the manual delete with `useMutation`, and replace the manual toggle optimistic update with `invalidateQueries`.

- [ ] **Step 1: Update imports at the top of `app/admin/PropertyList.tsx`**

Find the existing imports block:

```ts
"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2, X, Star, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { toggleFeatured } from "@/app/actions/featured";
import { CATEGORY_LABELS, MAX_FEATURED } from "@/app/lib/utils";
```

Replace with:

```ts
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2, X, Star, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFeatured } from "@/app/actions/featured";
import { CATEGORY_LABELS, MAX_FEATURED } from "@/app/lib/utils";
```

- [ ] **Step 2: Replace the data-fetching state and effects inside `PropertyList`**

Inside the `PropertyList` component function, find and remove these lines:

```ts
const [properties, setProperties]     = useState<Property[]>([]);
const [loadingList, setLoadingList]   = useState(true);
```

And remove the entire `fetchProperties` callback and its `useEffect`:

```ts
const fetchProperties = useCallback(async () => {
  setLoadingList(true);
  const res = await fetch("/api/properties");
  if (res.ok) setProperties(await res.json());
  setLoadingList(false);
}, []);

// eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(() => { fetchProperties(); }, [fetchProperties]);
```

Replace all of the above with:

```ts
const queryClient = useQueryClient();
const { data: properties = [], isLoading: loadingList } = useQuery<Property[]>({
  queryKey: ["admin-properties"],
  queryFn: () => fetch("/api/properties").then((r) => r.json()),
});
```

- [ ] **Step 3: Replace the delete handler with useMutation**

Find and remove the entire `handleDelete` function:

```ts
const handleDelete = async () => {
  if (!toDelete) return;
  setDeleting(true);
  const res = await fetch(`/api/properties/${toDelete.slug}`, { method: "DELETE" });
  if (res.ok) setProperties((prev) => prev.filter((p) => p.slug !== toDelete.slug));
  setDeleting(false);
  setToDelete(null);
};
```

Replace with a `useMutation` declaration and a thin handler that calls it. Add this inside the component, just after the `queryClient` line:

```ts
const deleteMutation = useMutation({
  mutationFn: (slug: string) =>
    fetch(`/api/properties/${slug}`, { method: "DELETE" }).then((r) => r.json()),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    setToDelete(null);
  },
  onSettled: () => setDeleting(false),
});

const handleDelete = () => {
  if (!toDelete) return;
  setDeleting(true);
  deleteMutation.mutate(toDelete.slug);
};
```

- [ ] **Step 4: Replace the toggle featured optimistic update with invalidateQueries**

Find the `handleToggleFeatured` function:

```ts
const handleToggleFeatured = (property: Property) => {
  setFeaturedError(null);
  startTransition(async () => {
    const result = await toggleFeatured(property.id, property.featured);
    if (result.error) {
      setFeaturedError(result.error);
    } else {
      setProperties((prev) =>
        prev.map((p) => p.id === property.id ? { ...p, featured: !p.featured } : p)
      );
    }
  });
};
```

Replace with:

```ts
const handleToggleFeatured = (property: Property) => {
  setFeaturedError(null);
  startTransition(async () => {
    const result = await toggleFeatured(property.id, property.featured);
    if (result.error) {
      setFeaturedError(result.error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    }
  });
};
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Manual smoke test**

Start the dev server: `npm run dev`

1. Navigate to `/admin` (log in if needed).
2. The property list should load — confirm it appears.
3. Delete a property — list should refresh automatically.
4. Toggle a featured star — list should refresh automatically.

- [ ] **Step 7: Commit**

```bash
git add app/admin/PropertyList.tsx
git commit -m "feat: migrate PropertyList to useQuery and useMutation"
```

---

## Task 5: Migrate EditPropertyForm final save to useMutation

**Files:**
- Modify: `app/admin/properties/[slug]/edit/EditPropertyForm.tsx`

The multi-step image upload (compress → presign → PUT to R2) stays as manual `useState`/`setLoading`. Only the final `fetch PUT /api/properties/[slug]` becomes a `useMutation`.

- [ ] **Step 1: Add React Query imports to `EditPropertyForm.tsx`**

Find the existing import line at the top:

```ts
import { useState, useRef } from "react";
```

Replace with:

```ts
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
```

- [ ] **Step 2: Add `queryClient` and `saveMutation` inside the component**

Inside the `EditPropertyForm` component function, after the `const router = useRouter();` line, add:

```ts
const queryClient = useQueryClient();

const saveMutation = useMutation({
  mutationFn: (body: Record<string, unknown>) =>
    fetch(`/api/properties/${property.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error("save failed");
      return r.json();
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    router.push("/admin");
  },
  onError: () => {
    setError("Hubo un error al guardar los cambios");
    setLoading(false);
  },
});
```

- [ ] **Step 3: Replace the final fetch in `handleSubmit` with `saveMutation.mutate`**

In `handleSubmit`, find the block that does the final save:

```ts
setUploadStatus("Guardando...");
const finalImages = [...existingImages, ...uploadedUrls];

const res = await fetch(`/api/properties/${property.slug}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...form, images: finalImages }),
});

if (res.ok) {
  router.push("/admin");
  router.refresh();
} else {
  setError("Hubo un error al guardar los cambios");
  setLoading(false);
}
```

Replace with:

```ts
setUploadStatus("Guardando...");
const finalImages = [...existingImages, ...uploadedUrls];
saveMutation.mutate({ ...form, images: finalImages });
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual smoke test**

1. Navigate to `/admin`, click Edit on any property.
2. Change the title, click Save.
3. Should redirect to `/admin` and show the updated title in the list.

- [ ] **Step 6: Commit**

```bash
git add app/admin/properties/[slug]/edit/EditPropertyForm.tsx
git commit -m "feat: migrate EditPropertyForm save to useMutation"
```

---

## Task 6: Migrate NewPropertyPage final save to useMutation

**Files:**
- Modify: `app/admin/properties/new/page.tsx`

Same pattern as Task 5. The image upload stays manual; only the final POST becomes a `useMutation`.

- [ ] **Step 1: Add React Query imports to `new/page.tsx`**

Find:

```ts
import { useState, useRef } from "react";
```

Replace with:

```ts
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
```

- [ ] **Step 2: Add `queryClient` and `createMutation` inside the component**

Inside `NewPropertyPage`, after `const router = useRouter();`, add:

```ts
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (body: Record<string, unknown>) =>
    fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error("create failed");
      return r.json();
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    router.push("/admin");
  },
  onError: () => {
    setError("Hubo un error al cargar la propiedad");
    setLoading(false);
  },
});
```

- [ ] **Step 3: Replace the final fetch in `handleSubmit` with `createMutation.mutate`**

Find:

```ts
setUploadStatus("Guardando propiedad...");
const res = await fetch("/api/properties", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...form, images: imageUrls }),
});

if (res.ok) {
  router.push("/admin");
} else {
  setError("Hubo un error al cargar la propiedad");
}
setLoading(false);
```

Replace with:

```ts
setUploadStatus("Guardando propiedad...");
createMutation.mutate({ ...form, images: imageUrls });
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual smoke test**

1. Navigate to `/admin/properties/new`.
2. Fill in a title + description, click Save.
3. Should redirect to `/admin` and show the new property in the list.

- [ ] **Step 6: Final full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors across the whole project.

- [ ] **Step 7: Commit**

```bash
git add app/admin/properties/new/page.tsx
git commit -m "feat: migrate NewPropertyPage save to useMutation"
```
