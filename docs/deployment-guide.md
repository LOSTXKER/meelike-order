# MIMS Deployment Guide

Complete guide to deploy MIMS to production on Vercel + Supabase.

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free tier is fine)
- [ ] Supabase account (free tier is fine)
- [ ] Line Developers Console account (optional)

---

## 🚀 Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Click "New Project"
3. Enter:
   - **Name**: `mims-production`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Southeast Asia (Singapore) - closest to Thailand
4. Click "Create project"
5. Wait 2-3 minutes for provisioning

### 1.2 Get Database Connection String

1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Choose **Connection pooling** → **Transaction mode**
4. Copy the URL (looks like):
   ```
   postgresql://postgres.xxxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `PASSWORD` with your actual password
6. **Save this** - you'll need it for Vercel

### 1.3 Get Supabase API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key
   - **service_role** key (keep secret!)

---

## 🔧 Step 2: Prepare GitHub Repository

### 2.1 Initialize Git (if not already)

```bash
cd /Users/lostxker/Desktop/dev/meelike-order

# Initialize git
git init

# Create .gitignore (should already exist)
# Make sure it includes:
# .env
# .env.local
# .next/
# node_modules/

# Add all files
git add .

# Commit
git commit -m "Initial commit - MIMS Phase 2 complete"
```

### 2.2 Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click **"+"** → **"New repository"**
3. Enter:
   - **Name**: `meelike-order`
   - **Private** (recommended)
   - **Do NOT** initialize with README (we already have one)
4. Click "Create repository"

### 2.3 Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/meelike-order.git

# Push
git branch -M main
git push -u origin main
```

---

## 🌐 Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [Vercel](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. **Import Git Repository**:
   - Select your GitHub repo `meelike-order`
   - Click "Import"

### 3.2 Configure Project

**Build & Development Settings**:
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 3.3 Add Environment Variables

Click **"Environment Variables"** and add:

```env
# Database
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Supabase (optional for now)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. ✅ Deployment successful!
4. You'll get a URL like: `https://meelike-order.vercel.app`

---

## 🗄️ Step 4: Run Database Migrations

### 4.1 Install Vercel CLI (optional)

```bash
npm i -g vercel
vercel login
```

### 4.2 Run Migrations Remotely

**Option A: From Local Machine**

Update your local `.env` to point to production database:

```bash
# Backup your local .env first!
cp .env .env.local.backup

# Update DATABASE_URL to production
# Then run:
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

**Option B: Via Vercel CLI**

```bash
# Link to Vercel project
vercel link

# Run migrations
vercel env pull .env.production
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

### 4.3 Verify Database

1. Go to Supabase Dashboard
2. Click **"Table Editor"**
3. You should see:
   - `users` (3 demo users)
   - `case_types` (5+ types)
   - `providers` (3+ providers)
   - `cases` (5+ sample cases)
   - `line_channels`
   - `notification_templates`
   - etc.

---

## ⏰ Step 5: Setup Cron Jobs

### 5.1 Create `vercel.json`

Create in project root:

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

This runs the outbox processor every 5 minutes.

### 5.2 Commit & Deploy

```bash
git add vercel.json
git commit -m "Add cron job for outbox processing"
git push origin main
```

Vercel will auto-deploy the update.

### 5.3 Verify Cron

1. Go to Vercel Dashboard → Your Project
2. Click **"Cron Jobs"** tab
3. You should see: `/api/cron/process-outbox` running every 5 minutes

---

## 🔔 Step 6: Configure Line Notification (Optional)

### 6.1 Create Line Channel

1. Go to [Line Developers Console](https://developers.line.biz)
2. Create a new **Messaging API** channel:
   - **Provider**: Create new or select existing
   - **Channel type**: Messaging API
   - **Channel name**: MIMS Notifications
   - **Channel description**: Issue tracking notifications
   - **Category**: Business
   - **Subcategory**: Customer Service
3. Click "Create"

### 6.2 Get Channel Access Token

1. Go to **Messaging API** tab
2. Scroll to **Channel access token**
3. Click "Issue" (if not issued)
4. **Copy the token** (long string)

### 6.3 Get Group ID

**To send to a Line Group**:

1. Add your bot to a Line group
2. Send a message mentioning the bot
3. Use Line Message API to get group ID, or:
4. Use a webhook to capture the group ID

**Quick Method** (for testing):
- You can use `U1234567890abcdef...` format for user IDs
- For groups, use `C1234567890abcdef...` format
- Get these from Line's webhook events

### 6.4 Configure in MIMS

1. Login to MIMS: `https://your-app.vercel.app/login`
2. Go to **Settings** → **Notifications**
3. Click **Line Channels** tab
4. Click **"เพิ่ม Line Channel"**
5. Fill in:
   - **Name**: "ทีม Support" (or your choice)
   - **Access Token**: Paste the long token
   - **Group ID**: Your Line group ID (optional)
   - **Events**: Select events you want to be notified about
6. Click "เพิ่ม Channel"

### 6.5 Test Notification

1. Create a new case
2. Check database `outbox` table:
   ```sql
   SELECT * FROM outbox ORDER BY created_at DESC LIMIT 5;
   ```
3. Wait for cron to run (max 5 minutes)
4. Check Line group - you should receive a message!

---

## 🔒 Step 7: Security Checklist

### 7.1 Environment Variables

- [ ] All secrets in Vercel environment variables (not in code)
- [ ] `NEXTAUTH_SECRET` is strong random string
- [ ] Database password is strong
- [ ] Supabase `service_role` key kept secret (not exposed to client)

### 7.2 Database

- [ ] RLS (Row Level Security) enabled on Supabase (optional for Phase 1)
- [ ] Connection pooling enabled
- [ ] Backup policy configured (Supabase does this automatically)

### 7.3 Application

- [ ] Only authenticated users can access dashboard
- [ ] Role-based access implemented
- [ ] API routes validate authentication
- [ ] No sensitive data in client-side logs

---

## 📊 Step 8: Monitoring & Maintenance

### 8.1 Vercel Analytics

1. Go to Vercel Dashboard → Your Project
2. Click **"Analytics"** tab
3. Enable **Web Analytics** (free)

### 8.2 Supabase Monitoring

1. Go to Supabase Dashboard
2. Click **"Database"** → **"Usage"**
3. Monitor:
   - Database size
   - Active connections
   - Query performance

### 8.3 Error Tracking (Optional)

**Sentry Setup**:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Follow wizard to configure.

### 8.4 Regular Tasks

- **Daily**: Check for failed outbox items
  ```sql
  SELECT * FROM outbox WHERE status = 'FAILED';
  ```

- **Weekly**: 
  - Review SLA compliance
  - Check provider risk levels
  - Monitor team performance

- **Monthly**:
  - Database backup verification
  - Security audit
  - Performance optimization

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"

**Solution**:
1. Check `DATABASE_URL` is correct in Vercel
2. Verify Supabase database is running
3. Check connection pooling is enabled
4. Test connection from local:
   ```bash
   npx prisma db pull
   ```

### Issue: "NextAuth session not working"

**Solution**:
1. Verify `NEXTAUTH_URL` matches your Vercel domain
2. Check `NEXTAUTH_SECRET` is set
3. Clear cookies and try again
4. Check browser console for errors

### Issue: "Line notifications not sending"

**Solution**:
1. Check `outbox` table for `FAILED` status
2. Review `last_error` field
3. Verify Line Channel Access Token is valid
4. Check Group ID is correct
5. Manually trigger cron:
   ```bash
   curl https://your-app.vercel.app/api/cron/process-outbox
   ```

### Issue: "Build fails on Vercel"

**Solution**:
1. Check build logs in Vercel
2. Common issues:
   - TypeScript errors → run `npm run build` locally first
   - Missing dependencies → check `package.json`
   - Prisma client → add `npx prisma generate` to build script
3. Fix and push again

### Issue: "Migrations fail"

**Solution**:
1. Check database connection
2. Run `npx prisma migrate status`
3. If stuck, reset:
   ```bash
   npx prisma migrate reset --skip-seed
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```

---

## 🎯 Post-Deployment Checklist

- [ ] Application accessible at production URL
- [ ] Login works with demo accounts
- [ ] Dashboard shows data
- [ ] Can create new case
- [ ] Reports page loads charts
- [ ] Team page shows members
- [ ] Settings pages accessible
- [ ] Line notification configured (optional)
- [ ] Cron job running
- [ ] Database backup enabled
- [ ] Monitoring configured
- [ ] Team trained on how to use

---

## 📞 Support

**Issues?**
- Check Vercel logs: Dashboard → Your Project → Logs
- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Check browser console for client errors

**Need Help?**
- Review `/docs/phase-2-summary.md`
- Check `/README.md`
- Contact: dev@meelike.com

---

## 🎉 Congratulations!

Your MIMS application is now live in production! 🚀

**What's Next?**
1. Onboard your team
2. Start tracking real cases
3. Monitor SLA compliance
4. Review reports weekly
5. Plan Phase 3 features

**Production URL**: `https://your-app.vercel.app`

---

**Deployed by**: [Your Name]  
**Date**: December 2024  
**Version**: Phase 2 Complete

