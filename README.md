# MIMS - Meelike Issue & Order Management System

ระบบจัดการเคสและปัญหาออเดอร์สำหรับ Meelike ที่พัฒนาด้วย Next.js 15, Prisma, และ Supabase

## ✨ Features

### Phase 1 MVP ✅


### 🔐 Authentication & Authorization
- ✅ NextAuth with email/password login
- ✅ Role-based access control (Admin, Support, Manager, CEO)
- ✅ Session management with JWT

### 📊 Dashboard
- ✅ Real-time case statistics
- ✅ SLA monitoring
- ✅ Critical alerts
- ✅ Recent cases overview
- ✅ Provider health status

### 📋 Case Management
- ✅ Create, view, update cases
- ✅ Status state machine (NEW → INVESTIGATING → RESOLVED → CLOSED)
- ✅ Severity levels (CRITICAL, HIGH, NORMAL, LOW)
- ✅ Case assignment to team members
- ✅ Timeline & Activity log (immutable)
- ✅ Link to Orders & Transactions
- ✅ Provider association
- ✅ SLA deadline tracking with countdown

### 🏢 Provider Management
- ✅ Provider listing with statistics
- ✅ Risk level calculation
- ✅ Resolution time tracking
- ✅ Refund rate monitoring

### 📈 Reports & Analytics
- ✅ Interactive charts (Recharts)
- ✅ Monthly trend analysis
- ✅ Cases by status, severity, category
- ✅ SLA compliance reporting
- ✅ Top providers performance
- ✅ Team performance metrics

### 👥 Team Management
- ✅ Team member performance dashboard
- ✅ Case assignment tracking
- ✅ Resolution rate by member
- ✅ Average resolution time per member

### ⚙️ Settings
- ✅ Case Types configuration
- ✅ SLA settings per case type
- ✅ Notification template management
- ✅ Line Channel integration
- ✅ Webhook configuration & testing

### 🔔 Notifications (Phase 2 - Completed)
- ✅ Line Messaging API integration
- ✅ Notification templates with variables
- ✅ Multi-channel support
- ✅ Outbox pattern for reliable delivery
- ✅ Background job for notification processing
- ✅ Event-based triggers

### Phase 2 ✅
- ✅ Interactive Reports & Analytics (Recharts)
- ✅ Team Management with performance metrics
- ✅ Settings pages (Case Types, Notifications)
- ✅ Line Notification integration
- ✅ Background job processing (Outbox pattern)

### Phase 3 ✅ (Advanced Features)
- ✅ **File Attachments** - Upload files to Supabase Storage
- ✅ **Advanced Filters** - Date range picker + multi-field filters
- ✅ **Export to CSV** - Export cases, reports, and team data
- ✅ **Bulk Operations** - Select multiple cases and perform actions
- ✅ **Audit Logs** - Complete activity tracking (from Phase 1)
- ✅ **API Rate Limiting** - Protect endpoints from abuse
- ✅ **Webhook Integration** - Send events to external systems

### 🎨 UI/UX
- ✅ Dark/Light mode
- ✅ Apple-inspired minimal design
- ✅ Responsive layout
- ✅ Real-time data with React Query
- ✅ Toast notifications (Sonner)
- ✅ Sidebar navigation with collapsible menu

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix UI)
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Notifications**: Sonner

### Backend
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 7
- **Auth**: NextAuth.js
- **Password Hashing**: bcryptjs
- **API**: Next.js API Routes

### DevOps
- **Deployment**: Vercel (recommended)
- **Database**: Supabase
- **Background Jobs**: Vercel Cron / Supabase Edge Functions

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account (or local PostgreSQL)

### Steps

1. **Clone the repository**
```bash
git clone <your-repo>
cd meelike-order
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase (Optional - for future features)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[GENERATE-SECRET]" # openssl rand -base64 32

# Line Messaging API (Optional - configure via UI)
LINE_CHANNEL_ACCESS_TOKEN=""
LINE_CHANNEL_SECRET=""
```

4. **Run Prisma migrations**
```bash
npx prisma generate
npx prisma migrate deploy
```

5. **Seed the database**
```bash
npx tsx prisma/seed.ts
```

This will create:
- Demo users (admin, support)
- Case types (เติมเงินไม่เข้า, Refund, etc.)
- Providers (TrueMoney, PromptPay, KBank)
- Sample cases
- Notification templates

6. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@meelike.com | password123 |
| Support A | support.a@meelike.com | password123 |
| Support B | support.b@meelike.com | password123 |

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Vercel will automatically:
- Build the Next.js app
- Connect to your Supabase database
- Setup domain and SSL

### Database Migrations on Production

```bash
npx prisma migrate deploy
```

## 📁 Project Structure

```
meelike-order/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Seed data
│   └── migrations/        # Migration history
├── src/
│   ├── app/
│   │   ├── (auth)/        # Auth pages (login)
│   │   ├── (dashboard)/   # Dashboard pages
│   │   │   ├── dashboard/
│   │   │   ├── cases/
│   │   │   ├── providers/
│   │   │   ├── reports/
│   │   │   ├── team/
│   │   │   └── settings/
│   │   ├── api/           # API routes
│   │   │   ├── auth/
│   │   │   ├── cases/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   ├── team/
│   │   │   ├── notifications/
│   │   │   └── cron/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── layout/        # Sidebar, Header
│   │   └── providers/     # SessionProvider
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client
│   │   ├── auth.ts        # Auth config
│   │   ├── constants.ts   # App constants
│   │   ├── line-notification.ts  # Line integration
│   │   └── utils.ts       # Utilities
│   └── types/             # TypeScript types
├── public/
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Background Jobs

### Line Notification Processing

The system uses an Outbox pattern for reliable Line notifications.

**Manual trigger (for testing):**
```bash
curl http://localhost:3000/api/cron/process-outbox
```

**Production setup (Vercel Cron):**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-outbox",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes to process pending notifications.

## 📊 Database Schema

### Core Models
- **User** - Authentication & team members
- **Case** - Issue tracking (status, severity, SLA)
- **CaseType** - Master data for case categories
- **CaseActivity** - Immutable timeline log
- **Provider** - Payment/service providers
- **Order** - Transaction linking
- **LineChannel** - Line Notify configuration
- **NotificationTemplate** - Message templates
- **Outbox** - Reliable message queue
- **Webhook** - External integrations
- **Attachment** - File uploads (Supabase Storage)

See `prisma/schema.prisma` for full schema.

## 🔐 Security

- ✅ Passwords hashed with bcryptjs
- ✅ JWT-based sessions
- ✅ Environment variables for secrets
- ✅ Database connection pooling
- ✅ Input validation with Zod
- ✅ API Rate limiting (in-memory)
- ✅ Webhook signature verification (HMAC SHA256)
- 🔜 API key authentication (Phase 4)

## 🧪 Testing

```bash
# Unit tests (coming soon)
npm test

# E2E tests (coming soon)
npm run test:e2e

# Type checking
npm run type-check
```

## 📝 API Documentation

### Cases API

**GET** `/api/cases` - List all cases
**POST** `/api/cases` - Create new case
**GET** `/api/cases/[id]` - Get case details
**PATCH** `/api/cases/[id]` - Update case
**GET** `/api/cases/[id]/activities` - Get case timeline
**POST** `/api/cases/[id]/activities` - Add activity/note

### Dashboard API

**GET** `/api/dashboard` - Dashboard statistics

### Reports API

**GET** `/api/reports` - Analytics data

### Team API

**GET** `/api/team` - Team performance

### Notifications API

**GET** `/api/notifications/templates` - List templates
**POST** `/api/notifications/templates` - Create template
**GET** `/api/notifications/channels` - List Line channels
**POST** `/api/notifications/channels` - Add Line channel

### Webhooks API

**GET** `/api/webhooks` - List all webhooks
**POST** `/api/webhooks` - Create new webhook
**GET** `/api/webhooks/[id]` - Get webhook details
**PATCH** `/api/webhooks/[id]` - Update webhook
**DELETE** `/api/webhooks/[id]` - Delete webhook
**POST** `/api/webhooks/[id]/test` - Test webhook delivery

## 🎯 Roadmap

### Phase 4 (Future)
- [ ] API key authentication
- [ ] Advanced webhook retry logic (exponential backoff)
- [ ] Redis-based rate limiting (for production)
- [ ] Knowledge base
- [ ] Customer portal
- [ ] Mobile app (React Native)

### Phase 5 (SaaS)
- [ ] Multi-tenancy
- [ ] Billing & subscriptions
- [ ] White-label options
- [ ] Custom domains
- [ ] Advanced analytics
- [ ] AI-powered insights

## 🤝 Contributing

This is an internal project. For feature requests or bugs, contact the development team.

## 📄 License

Proprietary - Meelike © 2025

## 📞 Support

- **Technical Issues**: dev@meelike.com
- **Documentation**: [Internal Wiki](#)
- **Slack**: #mims-support

---

**Built with ❤️ by Meelike Dev Team**
