# MIMS - Meelike Issue & Order Management System

> ระบบจัดการเคสและปัญหาออเดอร์สำหรับ Meelike  
> Built with Next.js 15, TypeScript, Prisma, และ Supabase

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)

---

## 📑 เนื้อหา

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [👤 Demo Accounts](#-demo-accounts)
- [📁 Project Structure](#-project-structure)
- [📚 Documentation](#-documentation)

---

## ✨ Features

### 🔐 Authentication & Authorization
- ✅ NextAuth with email/password login
- ✅ Role-based access control (4 roles: CEO, MANAGER, SUPPORT, TECHNICIAN)
- ✅ Session management with JWT

### 📊 Dashboard
- ✅ Real-time case statistics
- ✅ SLA monitoring & alerts
- ✅ Critical cases overview
- ✅ Recent activity timeline

### 📋 Case Management
- ✅ Full CRUD operations
- ✅ Status workflow (NEW → INVESTIGATING → FIXING → RESOLVED → CLOSED)
- ✅ 4 severity levels (CRITICAL, HIGH, NORMAL, LOW)
- ✅ Smart assignment to team members
- ✅ Immutable activity timeline
- ✅ Order & transaction linking
- ✅ File attachments (Supabase Storage)
- ✅ SLA deadline tracking
- ✅ Soft delete with audit trail

### 👥 Team Management
- ✅ Performance dashboard
- ✅ Case load balancing
- ✅ Resolution metrics per member
- ✅ Average response time tracking

### 📈 Reports & Analytics
- ✅ Interactive charts (Recharts)
- ✅ Monthly trend analysis
- ✅ Cases by status/severity/category
- ✅ SLA compliance reporting
- ✅ Provider performance metrics
- ✅ Export to CSV

### ⚙️ Settings
- ✅ Case types configuration
- ✅ SLA settings per type
- ✅ Notification templates
- ✅ Line integration
- ✅ Webhook management
- ✅ User management

### 🔔 Notifications
- ✅ Line Messaging API integration
- ✅ Immediate notification delivery
- ✅ Template-based messages
- ✅ Event-based triggers
- ✅ SLA warning alerts

### 🎨 UI/UX
- ✅ Dark/Light mode
- ✅ Fully responsive (mobile-ready)
- ✅ Apple-inspired minimal design
- ✅ Real-time updates (React Query)
- ✅ Toast notifications
- ✅ Progressive Web App ready

### 🛡️ Security & Performance
- ✅ Password hashing (bcryptjs)
- ✅ Input validation (Zod)
- ✅ API rate limiting
- ✅ Webhook signature verification
- ✅ Error handling with proper logging
- ✅ Optimistic UI updates

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix UI)
- **Data Fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Notifications**: Sonner

### Backend
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 7
- **Auth**: NextAuth.js v4
- **Password**: bcryptjs
- **API**: Next.js API Routes (App Router)

### Architecture
- **Services Layer**: Business logic separation
- **Error Handling**: Centralized with custom error classes
- **Validation**: Zod schemas across the stack
- **Types**: Unified Prisma-generated types

### DevOps
- **Deployment**: Vercel
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Cron Jobs**: Vercel Cron

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account

### Installation

```bash
# 1. Clone repository
git clone <your-repo>
cd meelike-order

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 4. Setup database
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[openssl rand -base64 32]"

# Optional: Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"

# Optional: Cron Security
CRON_SECRET="[YOUR-SECRET]"
```

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **CEO** | ceo@meelike.com | password123 |
| **Manager** | manager@meelike.com | password123 |
| **Support** | support@meelike.com | password123 |
| **Technician** | tech@meelike.com | password123 |

### Role Permissions

- **CEO**: Full system access, user management, settings
- **MANAGER**: View all cases, assign tasks, reports
- **SUPPORT**: Create cases, view all, close cases, notify customers
- **TECHNICIAN**: View assigned cases only, resolve problems

---

## 📁 Project Structure

```
meelike-order/
├── docs/                      # 📚 Documentation
│   ├── deployment-guide.md
│   ├── quick-start-guide.md
│   └── testing-checklist.md
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── migrations/            # Migration history
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   │   ├── dashboard/
│   │   │   ├── cases/
│   │   │   ├── providers/
│   │   │   ├── reports/
│   │   │   ├── team/
│   │   │   └── settings/
│   │   └── api/               # API routes
│   │       ├── auth/
│   │       ├── cases/
│   │       ├── dashboard/
│   │       ├── reports/
│   │       └── cron/
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── case-types/        # Feature components
│   │   ├── cases/
│   │   ├── layout/
│   │   └── providers/
│   ├── hooks/                 # React Query hooks
│   ├── lib/
│   │   ├── validations.ts     # Zod schemas
│   │   ├── error-handler.ts   # Error handling
│   │   ├── auth-helpers.ts    # Auth utilities
│   │   └── line-notification.ts
│   ├── services/              # Business logic
│   │   └── case.service.ts
│   └── types/                 # TypeScript types
├── ARCHITECTURE.md            # Architecture docs
├── ROLES.md                   # Role permissions
└── README.md
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture refactoring details
- **[ROLES.md](./ROLES.md)** - Role-based permissions guide
- **[docs/deployment-guide.md](./docs/deployment-guide.md)** - Production deployment
- **[docs/quick-start-guide.md](./docs/quick-start-guide.md)** - Getting started
- **[docs/testing-checklist.md](./docs/testing-checklist.md)** - Testing guide

---

## 🔄 Key Workflows

### Case Creation Flow
1. Support receives issue from customer
2. Create case with details (type, severity, description)
3. System auto-assigns to available technician
4. Line notification sent to team
5. SLA deadline calculated

### Case Resolution Flow
1. Technician reviews case
2. Updates status to INVESTIGATING → FIXING
3. Resolves issue, updates resolution notes
4. Changes status to RESOLVED
5. Support notifies customer
6. Case closed with final notes

### SLA Monitoring
1. Cron job runs every 10 minutes
2. Checks cases approaching SLA deadline
3. Sends warning at 50% time remaining
4. Sends critical alert when SLA missed
5. Anti-spam: alerts sent once per threshold

---

## 🎯 Scripts

```bash
# Development
npm run dev          # Start dev server (Turbopack)
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio

# Utilities
npm run type-check   # TypeScript check
npm run lint         # ESLint check
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

Vercel auto-configures:
- Next.js build optimization
- Database connection
- Cron jobs (via `vercel.json`)
- Domain & SSL

### Environment Variables (Production)

Add to Vercel:
- `DATABASE_URL`
- `NEXTAUTH_URL` (your domain)
- `NEXTAUTH_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔐 Security

✅ Password hashing (bcryptjs)  
✅ JWT sessions (NextAuth)  
✅ Input validation (Zod)  
✅ Rate limiting (API protection)  
✅ Webhook HMAC verification  
✅ Environment variables for secrets  
✅ Soft delete (audit trail)  

---

## 📊 Database Models

| Model | Description |
|-------|-------------|
| **User** | Authentication & team members |
| **Case** | Issue tracking with SLA |
| **CaseType** | Master data for categories |
| **CaseActivity** | Immutable timeline log |
| **Provider** | Payment/service providers |
| **Order** | Transaction linking |
| **Attachment** | File uploads (Supabase) |
| **LineChannel** | Line API configuration |
| **NotificationTemplate** | Message templates |
| **Webhook** | External integrations |

See `prisma/schema.prisma` for full details.

---

## 🎯 Roadmap

### Phase 4 (Future)
- [ ] API key authentication
- [ ] Redis-based rate limiting
- [ ] Advanced webhook retry logic
- [ ] Knowledge base
- [ ] Customer self-service portal

### Phase 5 (SaaS)
- [ ] Multi-tenancy support
- [ ] Billing & subscriptions
- [ ] White-label options
- [ ] AI-powered insights

---

## 🤝 Contributing

This is an internal Meelike project. For feature requests or bugs, contact the development team.

---

## 📄 License

Proprietary - Meelike © 2025

---

## 📞 Support

- **Technical Issues**: dev@meelike.com
- **Documentation**: [Internal Wiki](#)

---

**Built with ❤️ by Meelike Dev Team**
