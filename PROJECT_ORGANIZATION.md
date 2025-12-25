# 🗂️ Project Organization Summary

เอกสารนี้อธิบายการจัดระเบียบไฟล์และโฟลเดอร์ในโปรเจค MIMS

---

## ✅ สิ่งที่ได้ทำ

### 1. **ลบไฟล์ที่ไม่ใช้แล้ว**
- ❌ `src/app/(dashboard)/cases/[id]/page_simple.tsx` - ไฟล์ backup/duplicate
- ❌ `src/app/api/cron/process-outbox/` - เปลี่ยนเป็น immediate notification แล้ว
- ❌ `docs/master_plan.md` - เอกสารล้าสมัย
- ❌ `docs/phase-2-summary.md` - เอกสารล้าสมัย
- ❌ `docs/phase-3-summary.md` - เอกสารล้าสมัย
- ❌ `docs/external-cron-setup.md` - ไม่เกี่ยวข้อง
- ❌ `DEPLOYMENT.md` - ย้ายไปอยู่ใน docs/ แล้ว
- ❌ `SUPABASE_STORAGE_SETUP.md` - ย้ายไปอยู่ใน docs/ แล้ว
- ❌ `tsconfig.tsbuildinfo` - temporary build file

### 2. **อัปเดต Documentation**
- ✅ `README.md` - เขียนใหม่ให้ชัดเจน มี badges, TOC, และโครงสร้างดีขึ้น
- ✅ `.gitignore` - เพิ่ม entries สำหรับ temp files, IDE, OS files
- ✅ `.env.example` - สร้าง template สำหรับ environment variables

### 3. **จัดระเบียบ Folder Structure**

```
meelike-order/
├── 📄 README.md              # Main documentation
├── 📄 ARCHITECTURE.md         # Architecture guide
├── 📄 ROLES.md                # Role permissions
├── 📄 BACKUP.md               # Backup guide (optional)
├── 📁 docs/                   # Additional documentation
│   ├── deployment-guide.md
│   ├── quick-start-guide.md
│   └── testing-checklist.md
├── 📁 prisma/                 # Database
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── 📁 src/
│   ├── app/                   # Next.js App Router
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities
│   ├── services/              # Business logic
│   └── types/                 # TypeScript types
├── 📁 public/                 # Static assets
└── 📁 scripts/                # Helper scripts
```

---

## 📚 Documentation Hierarchy

### Root Level (Quick Access)
- `README.md` - เอกสารหลัก, quick start, overview
- `ARCHITECTURE.md` - อธิบาย refactoring, services layer, best practices
- `ROLES.md` - อธิบาย role-based permissions แต่ละ role

### docs/ Folder (Detailed Guides)
- `deployment-guide.md` - วิธี deploy production
- `quick-start-guide.md` - setup local development
- `testing-checklist.md` - testing procedures

### Optional (สามารถลบได้)
- `BACKUP.md` - Supabase backup guide (optional, can remove if using Supabase UI)

---

## 🧹 Maintenance Guidelines

### ไฟล์ที่ควร .gitignore
```gitignore
# Build outputs
/.next/
/out/
*.tsbuildinfo

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Temporary
*.tmp
*.temp
*.backup
```

### ไฟล์ที่ควร Commit
```
✅ .env.example       # Template
✅ README.md          # Documentation
✅ package-lock.json  # Lock dependencies
✅ prisma/schema.prisma
✅ src/**/*.ts(x)     # Source code
✅ public/**/*        # Assets
```

### ไฟล์ที่ไม่ควร Commit
```
❌ .env              # Secrets
❌ .next/            # Build output
❌ node_modules/     # Dependencies
❌ *.tsbuildinfo     # Build cache
❌ tsconfig.tsbuildinfo
```

---

## 📁 Folder Structure Details

### `/src/app/`
- `(auth)/` - Authentication pages (login)
- `(dashboard)/` - Protected pages
  - `dashboard/` - Main dashboard
  - `cases/` - Case management
  - `providers/` - Provider management
  - `reports/` - Analytics
  - `team/` - Team performance
  - `settings/` - System settings
- `api/` - API routes
  - `auth/` - NextAuth
  - `cases/` - Case CRUD
  - `cron/` - Background jobs
  - etc.

### `/src/components/`
- `ui/` - shadcn/ui base components
- `case-types/` - Case type specific components
- `cases/` - Case management components
- `layout/` - Header, Sidebar
- `providers/` - React context providers

### `/src/lib/`
- `validations.ts` - Zod schemas
- `error-handler.ts` - Error handling
- `auth-helpers.ts` - Auth utilities
- `line-notification.ts` - Line integration
- `webhook.ts` - Webhook utilities
- `prisma.ts` - Prisma client
- `utils.ts` - General utilities

### `/src/services/`
- `case.service.ts` - Case business logic
- (Future) `user.service.ts`, `provider.service.ts`, etc.

### `/src/hooks/`
- `use-cases.ts` - React Query hooks for cases
- `use-dashboard.ts` - Dashboard data
- `use-reports.ts` - Analytics data
- etc.

---

## 🔄 File Naming Conventions

### React Components
```
✅ PascalCase for files: UserProfile.tsx
✅ PascalCase for exports: export function UserProfile()
✅ kebab-case for folders: /case-types/
```

### API Routes
```
✅ route.ts for endpoints
✅ [id]/route.ts for dynamic routes
```

### Utilities & Libs
```
✅ kebab-case: error-handler.ts
✅ camelCase exports: export function handleError()
```

### Hooks
```
✅ use-prefix: use-cases.ts
✅ camelCase export: export function useCases()
```

---

## 🎯 Best Practices

### 1. **Keep Root Clean**
- เก็บแค่ config files ที่จำเป็น
- ย้าย documentation ไป `/docs/`
- ไม่เก็บ temporary files

### 2. **Organize by Feature**
- Group related components together
- `/components/case-types/` แทนที่จะ `/components/CaseTypeForm.tsx`

### 3. **Separate Concerns**
- `/services/` - Business logic
- `/lib/` - Utilities
- `/components/` - UI only
- `/hooks/` - Data fetching

### 4. **Document Everything**
- README.md for overview
- Inline comments for complex logic
- JSDoc for public APIs

### 5. **Clean Regularly**
- ลบไฟล์ที่ไม่ใช้
- อัปเดต documentation
- Review .gitignore

---

## 📋 Checklist for New Files

เมื่อสร้างไฟล์ใหม่:

- [ ] ตั้งชื่อตาม naming convention
- [ ] ใส่ไว้ใน folder ที่เหมาะสม
- [ ] เพิ่ม TypeScript types
- [ ] เพิ่ม JSDoc comments (ถ้าเป็น public API)
- [ ] Import types จาก `/types/index.ts`
- [ ] ใช้ centralized error handling
- [ ] ใช้ Zod validation (ถ้าเป็น API)

---

## 🚀 Future Improvements

- [ ] Add `/tests/` folder for unit tests
- [ ] Add `/scripts/` for more utilities
- [ ] Consider monorepo structure (if scaling)
- [ ] Add Storybook for component documentation

---

**Updated**: Dec 26, 2025

