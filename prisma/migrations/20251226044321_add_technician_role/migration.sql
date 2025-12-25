-- Add TECHNICIAN role and rename ADMIN to CEO
-- New role structure:
-- CEO: ผู้ดูแลระบบสูงสุด (full access)
-- MANAGER: ดูภาพรวม/ดูแลทีม (view all cases, assign work)
-- SUPPORT: รับเรื่อง/แจ้งลูกค้า (create cases, close cases)
-- TECHNICIAN: คนแก้ปัญหา (view own cases only)

-- Step 1: Rename ADMIN to CEO (if any users still have ADMIN role)
UPDATE "users" 
SET "role" = 'CEO' 
WHERE "role" = 'ADMIN';

-- Step 2: Rename old SUPPORT to TECHNICIAN
UPDATE "users" 
SET "role" = 'TECHNICIAN' 
WHERE "role" = 'SUPPORT';

-- Step 3: Recreate enum with new values
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM ('CEO', 'MANAGER', 'SUPPORT', 'TECHNICIAN');

ALTER TABLE "users" 
  ALTER COLUMN "role" TYPE "UserRole" 
  USING "role"::text::"UserRole";

DROP TYPE "UserRole_old";

-- Step 4: Set default to TECHNICIAN for new users
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'TECHNICIAN';

