# 🏗️ Architecture Refactoring

## 📋 สรุปการ Refactor

เราได้ทำการ refactor โครงสร้างโค้ดเพื่อให้ maintainable, scalable, และ type-safe มากขึ้น

---

## ✅ สิ่งที่ได้ทำ

### 1. **Services Layer** ✨

สร้าง business logic layer แยกออกจาก API routes

```
src/services/
└── case.service.ts         # CaseService with all CRUD operations
```

**ประโยชน์:**
- แยก business logic ออกจาก API routes
- ง่ายต่อการ test
- Reusable across multiple endpoints
- Single source of truth สำหรับ database operations

**ตัวอย่างการใช้งาน:**

```typescript
// Before (ใน API route)
const cases = await prisma.case.findMany({ where: {...}, include: {...} });

// After (ใช้ Service)
const cases = await CaseService.getCases(filters, page, limit);
```

---

### 2. **Zod Validation** 🛡️

เพิ่ม input validation ทุกจุดที่รับข้อมูลจาก client

```
src/lib/
└── validations.ts          # Zod schemas for all entities
```

**Schemas ที่มี:**
- `CreateCaseSchema`, `UpdateCaseSchema`
- `CreateUserSchema`, `UpdateUserSchema`
- `CreateProviderSchema`, `UpdateProviderSchema`
- `CreateCaseTypeSchema`, `UpdateCaseTypeSchema`
- `CreateWebhookSchema`, `UpdateWebhookSchema`
- และอื่นๆ

**ตัวอย่างการใช้งาน:**

```typescript
// Before
const body = await request.json();
// ใช้ body โดยไม่ validate -> อันตราย!

// After
const body = await request.json();
const validatedData = CreateCaseSchema.parse(body); // Type-safe + validated
```

---

### 3. **Refactored API Routes** 🔄

แยก logic ออกจาก API routes ให้กระชับและอ่านง่าย

**Before:**
```typescript
// /api/cases/route.ts - 200+ lines
export async function GET(request) {
  // ตรวจสอบ auth
  // ตรวจสอบ permission
  // parse query params
  // build where clause
  // fetch from database
  // handle errors
}
```

**After:**
```typescript
// /api/cases/route.ts - 30 lines
export const GET = asyncErrorHandler(async (request) => {
  assertAuthenticated(session?.user);
  const filters = CaseFiltersSchema.parse(rawFilters);
  const result = await CaseService.getCases(filters, page, limit);
  return NextResponse.json(result);
});
```

**Refactored APIs:**
- ✅ `/api/cases` (GET, POST)
- ✅ `/api/cases/[id]` (GET, PATCH, DELETE)
- ✅ `/api/cases/counts` (GET)

---

### 4. **Component Separation** 📦

แยก components ขนาดใหญ่ออกเป็นส่วนย่อย

**Before:**
```
settings/case-types/page.tsx - 988 lines (ทุกอย่างในไฟล์เดียว)
```

**After:**
```
components/case-types/
├── case-type-form.tsx       # Form component (250 lines)
└── case-type-table.tsx      # Table component (150 lines)

settings/case-types/page.tsx # Main page (180 lines)
```

**ประโยชน์:**
- แต่ละ component มีหน้าที่ชัดเจน
- ง่ายต่อการ maintain
- สามารถ reuse ได้

---

### 5. **Unified Types** 📘

ใช้ Prisma-generated types แทนการสร้าง types เอง

```
src/types/
└── index.ts                # Centralized type exports
```

**Before:**
```typescript
// use-cases.ts
interface Case {
  id: string;
  title: string;
  // ... ต้องพิมพ์ซ้ำ
}

// page.tsx
interface Case {
  id: string;
  title: string;
  // ... พิมพ์ซ้ำอีก!
}
```

**After:**
```typescript
// types/index.ts
export type Case = Prisma.CaseGetPayload<{
  include: { caseType: true, owner: true }
}>;

// ใช้ได้ทุกที่
import { Case } from "@/types";
```

**Types ที่มี:**
- `Case`, `CaseWithBasicRelations`, `CaseActivity`
- `User`, `UserWithStats`
- `Provider`, `ProviderWithStats`
- `CaseType`, `CaseTypeWithCount`
- `Order`, `Attachment`
- `DashboardStats`, `ReportData`, `TeamMember`
- Enum re-exports: `UserRole`, `CaseStatus`, `CaseSeverity`, etc.

---

### 6. **Error Handler** 🚨

Centralized error handling ทั้งระบบ

```
src/lib/
└── error-handler.ts        # Error classes + handlers
```

**Error Classes:**
- `AppError` - Base error class
- `ValidationError` - Input validation failed
- `AuthenticationError` - Not logged in
- `ForbiddenError` - No permission
- `NotFoundError` - Resource not found
- `ConflictError` - Duplicate resource
- `RateLimitError` - Too many requests

**Helper Functions:**
- `asyncErrorHandler()` - Wrap API handlers
- `assertExists()` - Assert value exists
- `assertAuthenticated()` - Assert user logged in
- `assertAuthorized()` - Assert user has permission
- `successResponse()`, `createdResponse()`, `noContentResponse()`

**ตัวอย่างการใช้งาน:**

```typescript
// Before
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ... rest of code
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// After
export const GET = asyncErrorHandler(async (request) => {
  const session = await getServerSession(authOptions);
  assertAuthenticated(session?.user); // Throws AuthenticationError if not logged in
  // ... rest of code (no try-catch needed!)
});
```

**Auto-handle Errors:**
- ✅ Zod validation errors → 400 with field details
- ✅ Prisma unique constraint → 409 Conflict
- ✅ Prisma not found → 404 Not Found
- ✅ Custom AppError → Correct status code
- ✅ Unknown errors → 500 Internal Error

---

## 📂 โครงสร้างใหม่

```
src/
├── app/
│   ├── api/                    # API routes (refactored - กระชับลง)
│   └── (dashboard)/            # Pages
├── components/
│   ├── case-types/             # ✨ New: Case type components
│   │   ├── case-type-form.tsx
│   │   └── case-type-table.tsx
│   └── ui/                     # Shadcn components
├── hooks/                      # React Query hooks
├── lib/
│   ├── validations.ts          # ✨ New: Zod schemas
│   ├── error-handler.ts        # ✨ New: Error handling
│   ├── auth-helpers.ts         # Auth utilities
│   ├── rate-limit.ts           # Rate limiting
│   └── utils.ts                # Misc utilities
├── services/                   # ✨ New: Business logic layer
│   └── case.service.ts
└── types/
    └── index.ts                # ✨ Refactored: Unified Prisma types
```

---

## 🎯 Best Practices ที่ใช้

### 1. **Separation of Concerns**
- API routes = routing + auth + validation
- Services = business logic + database operations
- Components = UI rendering

### 2. **Single Responsibility**
- แต่ละ class/function ทำแค่สิ่งเดียว
- Components เล็กและมี focus

### 3. **DRY (Don't Repeat Yourself)**
- Reuse services
- Reuse validation schemas
- Reuse error handlers

### 4. **Type Safety**
- Prisma types ทั่วทั้งระบบ
- Zod validation = runtime type checking
- TypeScript = compile-time type checking

### 5. **Error Handling**
- Consistent error responses
- Proper status codes
- Detailed error messages (development) vs generic (production)

---

## 🚀 วิธีใช้งาน Architecture ใหม่

### สร้าง Service ใหม่

```typescript
// src/services/provider.service.ts
export class ProviderService {
  static async getProviders(filters: ProviderFilters) {
    return await prisma.provider.findMany({ where: filters });
  }

  static async createProvider(data: CreateProviderInput) {
    return await prisma.provider.create({ data });
  }
}
```

### สร้าง Validation Schema ใหม่

```typescript
// src/lib/validations.ts
export const CreateProviderSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["API", "MANUAL"]),
});
```

### สร้าง API Route ใหม่

```typescript
// src/app/api/providers/route.ts
import { asyncErrorHandler, assertAuthenticated } from "@/lib/error-handler";
import { CreateProviderSchema } from "@/lib/validations";
import { ProviderService } from "@/services/provider.service";

export const POST = asyncErrorHandler(async (request) => {
  const session = await getServerSession(authOptions);
  assertAuthenticated(session?.user);
  
  const body = await request.json();
  const validatedData = CreateProviderSchema.parse(body);
  
  const provider = await ProviderService.createProvider(validatedData);
  return NextResponse.json(provider, { status: 201 });
});
```

---

## 📊 Metrics

| ก่อน Refactor | หลัง Refactor | ปรับปรุง |
|---------------|---------------|----------|
| `/api/cases/[id]/route.ts`: 390 lines | 150 lines | **-61%** |
| `case-types/page.tsx`: 988 lines | 180 lines | **-81%** |
| No validation | Full Zod validation | **+100%** |
| Mixed types | Unified Prisma types | **+100%** |
| Ad-hoc error handling | Centralized error handler | **+100%** |

---

## 🔜 Next Steps (Optional)

1. **Refactor remaining API routes** to use Services + Error Handler
2. **Create more Services**: `UserService`, `ProviderService`, `CaseTypeService`
3. **Add Unit Tests** for Services
4. **Add Integration Tests** for API routes
5. **Document API** with OpenAPI/Swagger

---

## 📖 References

- [Next.js Best Practices](https://nextjs.org/docs)
- [Zod Documentation](https://zod.dev)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

