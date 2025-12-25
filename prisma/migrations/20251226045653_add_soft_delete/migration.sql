-- Add Soft Delete fields to Case table
-- This allows cases to be "deleted" without actually removing the data

-- Add isDeleted column with default false
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- Add deletedAt column for tracking when the case was deleted
ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Create index for faster filtering of non-deleted cases
CREATE INDEX IF NOT EXISTS "cases_isDeleted_idx" ON "cases"("isDeleted");

