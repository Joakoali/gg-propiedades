-- CreateEnum
CREATE TYPE "Category" AS ENUM ('houses', 'lots', 'local');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "category" "Category" NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "bedrooms" INTEGER,
    "coveredArea" INTEGER,
    "semiCoveredArea" INTEGER,
    "lotArea" INTEGER,
    "neighborhood" TEXT,
    "zone" TEXT,
    "pool" BOOLEAN NOT NULL DEFAULT false,
    "financing" BOOLEAN NOT NULL DEFAULT false,
    "mortgageEligible" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
