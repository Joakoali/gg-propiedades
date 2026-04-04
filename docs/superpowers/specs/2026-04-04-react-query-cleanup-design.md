# Design: Dead Code Cleanup + React Query (Admin)

**Date:** 2026-04-04  
**Scope:** Admin section only. Public pages (Server Components with `unstable_cache`) are untouched.

---

## 1. Dead Code Cleanup

### 1.1 Remove `uploadToR2()` from `app/lib/r2.ts`
- Lines 126–188: `uploadToR2()` is dead. Its only consumer was `app/api/upload/route.ts`, which was deleted.
- `generatePresignedPutUrl()` (lines 1–124) stays — used by `app/api/upload/presign/route.ts`.

### 1.2 Remove `getCachedZones()` from `app/lib/public-properties.ts`
- Lines 219–221: function body is `return ZONES` — a constant, not async work.
- Call site: `app/propiedades/page.tsx` — replace `getCachedZones()` with direct `ZONES` import from `app/lib/utils`.

### 1.3 Remove duplicate `CATEGORY_LABELS` from `app/admin/PropertyList.tsx`
- Lines 23–27: identical to the export in `app/lib/utils.ts`.
- Replace with `import { CATEGORY_LABELS } from "@/app/lib/utils"`.

### 1.4 Verify no dangling `prisma.ts` references
- `app/lib/prisma.ts` is already deleted from disk. Grep to confirm nothing imports it.

---

## 2. React Query Setup

**Package:** `@tanstack/react-query` (latest v5).

**Provider:** Update `app/components/Providers.tsx` to create a `QueryClient` per render tree and wrap children with `QueryClientProvider`. `SessionProvider` nests inside it.

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

**Query key:** `['admin-properties']` — shared across all admin mutations so invalidation is consistent.

---

## 3. PropertyList Migration (`app/admin/PropertyList.tsx`)

### Data fetching
Replace `useEffect` + `useState<Property[]>` + `useCallback fetchProperties` with:
```ts
const { data: properties = [], isLoading } = useQuery({
  queryKey: ['admin-properties'],
  queryFn: () => fetch('/api/properties').then(r => r.json()),
});
```
Remove: `loadingList` state, `fetchProperties` callback, `useEffect`.

### Delete mutation
Replace manual `fetch` + `setProperties(prev => prev.filter(...))` with:
```ts
const deleteMutation = useMutation({
  mutationFn: (slug: string) =>
    fetch(`/api/properties/${slug}`, { method: 'DELETE' }).then(r => r.json()),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-properties'] }),
});
```

### Toggle featured
Keep the `toggleFeatured` server action (it runs `revalidateTag` for public cache).  
Replace the manual `setProperties(prev => prev.map(...))` optimistic update with:
```ts
const result = await toggleFeatured(property.id, property.featured);
if (!result.error) {
  queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
}
```
`useTransition` stays (server actions need it for pending state).

---

## 4. EditPropertyForm Migration (`app/admin/properties/[slug]/edit/EditPropertyForm.tsx`)

The multi-step image upload (compress → presign → PUT to R2) stays as manual `useState`/`setLoading` — it is not a simple query.

Only the **final save** becomes a mutation:
```ts
const saveMutation = useMutation({
  mutationFn: (body: object) =>
    fetch(`/api/properties/${property.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    router.push('/admin');
  },
  onError: () => setError('Hubo un error al guardar los cambios'),
});
```
Remove `router.refresh()` — invalidation handles freshness.  
`EditPropertyPage` (server component) is unchanged.

---

## 5. NewPropertyPage Migration (`app/admin/properties/new/page.tsx`)

Same pattern as EditPropertyForm. Image upload stays manual. Final POST becomes:
```ts
const createMutation = useMutation({
  mutationFn: (body: object) =>
    fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    router.push('/admin');
  },
  onError: () => setError('Hubo un error al cargar la propiedad'),
});
```

---

## 6. Files Changed Summary

| File | Change |
|------|--------|
| `app/lib/r2.ts` | Remove `uploadToR2()` (lines 126–188) |
| `app/lib/public-properties.ts` | Remove `getCachedZones()` |
| `app/propiedades/page.tsx` | Replace `getCachedZones()` call with direct `ZONES` import |
| `app/components/Providers.tsx` | Add `QueryClientProvider` |
| `app/admin/PropertyList.tsx` | `useQuery` + `useMutation` for fetch/delete/toggle |
| `app/admin/properties/[slug]/edit/EditPropertyForm.tsx` | `useMutation` for final save |
| `app/admin/properties/new/page.tsx` | `useMutation` for final save |
| `package.json` | Add `@tanstack/react-query` |

**Files NOT changed:** All public pages, API routes, server actions, `r2.ts` presign logic, `EditPropertyPage` server component.
