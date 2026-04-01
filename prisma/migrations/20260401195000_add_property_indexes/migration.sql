-- Speed up the public catalog and home queries.
-- B-tree indexes cover exact-match filters and common sorts.
CREATE INDEX "Property_featured_createdAt_idx"
ON "Property"("featured", "createdAt" DESC);

CREATE INDEX "Property_category_createdAt_idx"
ON "Property"("category", "createdAt" DESC);

CREATE INDEX "Property_price_idx"
ON "Property"("price");

CREATE INDEX "Property_bedrooms_idx"
ON "Property"("bedrooms");

-- Trigram indexes make ILIKE '%text%' searches on title/zone usable at scale.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Property_title_trgm_idx"
ON "Property"
USING GIN ("title" gin_trgm_ops);

CREATE INDEX "Property_zone_trgm_idx"
ON "Property"
USING GIN ("zone" gin_trgm_ops);
