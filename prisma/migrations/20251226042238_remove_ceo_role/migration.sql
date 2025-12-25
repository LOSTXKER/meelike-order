-- Remove CEO from UserRole enum
-- This migration removes the CEO role and enforces a 3-role system:
-- ADMIN (full access), MANAGER (team lead), SUPPORT (technician)

-- Step 1: Update any CEO users to ADMIN
UPDATE "users" 
SET "role" = 'ADMIN' 
WHERE "role" = 'CEO';

-- Step 2: Remove CEO from the enum
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'SUPPORT');

ALTER TABLE "users" 
  ALTER COLUMN "role" TYPE "UserRole" 
  USING "role"::text::"UserRole";

DROP TYPE "UserRole_old";

