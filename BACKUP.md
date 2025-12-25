# 🗄️ Supabase Backup & Recovery Guide

## 📋 Overview

This guide explains how to set up automated backups for your Supabase database and how to restore them if needed.

---

## 🔄 Automatic Backups (Recommended)

### Supabase Built-in Backups

Supabase automatically creates Point-in-Time Recovery (PITR) backups:

1. **Navigate to Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/database
   ```

2. **Enable PITR (Point-in-Time Recovery)**
   - Go to **Settings** → **Database** → **Backups**
   - Enable **Point-in-Time Recovery**
   - **Available on:** Pro plan and above
   - **Retention:** 7-30 days depending on plan

3. **Benefits:**
   - Continuous backup every second
   - Restore to any point in time
   - No performance impact
   - Automatic & maintenance-free

### Pricing & Plans

| Plan | PITR | Daily Backups | Retention |
|------|------|---------------|-----------|
| Free | ❌ | ✅ (1 week) | 7 days |
| Pro | ✅ | ✅ | 7-30 days |
| Enterprise | ✅ | ✅ | Custom |

---

## 📥 Manual Backup (Free Plan)

If you're on the Free plan, use these methods:

### Method 1: pg_dump (Recommended)

```bash
# Install PostgreSQL client tools
brew install postgresql  # macOS
# or
sudo apt install postgresql-client  # Linux

# Get your connection string from Supabase Dashboard
# Settings → Database → Connection string (Direct connection)

# Create backup
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --file="backup-$(date +%Y%m%d-%H%M%S).sql" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists

# Compress backup
gzip backup-*.sql
```

### Method 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Create backup
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Compress
gzip backup-*.sql
```

### Method 3: GitHub Actions (Automated)

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client

      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump "$DATABASE_URL" \
            --file="backup-$(date +%Y%m%d-%H%M%S).sql" \
            --format=plain \
            --no-owner \
            --no-acl

      - name: Compress backup
        run: gzip backup-*.sql

      - name: Upload to GitHub Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backup-*.sql.gz
          retention-days: 30
```

---

## 🔧 Restore from Backup

### Restore using pg_restore

```bash
# Decompress backup
gunzip backup-20240101-020000.sql.gz

# Restore to database
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --file=backup-20240101-020000.sql

# Or use pg_restore for custom format
pg_restore \
  --dbname="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --clean \
  --if-exists \
  backup-20240101-020000.dump
```

### Restore using Supabase CLI

```bash
# Restore from SQL file
supabase db push --file backup-20240101-020000.sql
```

### Restore PITR (Pro Plan)

1. Go to **Supabase Dashboard** → **Settings** → **Database** → **Backups**
2. Click **Restore** next to the backup point
3. Select **date and time** to restore to
4. Confirm restoration (⚠️ This will replace current data)

---

## 🛡️ Best Practices

### 1. **3-2-1 Backup Rule**
- **3** copies of data
- **2** different storage types
- **1** off-site backup

### 2. **Automated Backups**
```bash
# Add to crontab (run daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * cd /path/to/project && ./scripts/backup.sh
```

### 3. **Test Restores Regularly**
```bash
# Restore to a test database monthly
createdb test_restore
psql test_restore < backup-latest.sql
```

### 4. **Monitor Backup Size**
```bash
# Check backup size growth
ls -lh backup-*.sql.gz
```

### 5. **Store Backups Securely**
- ✅ AWS S3
- ✅ Google Cloud Storage
- ✅ Backblaze B2
- ❌ Local disk only

---

## 📦 Backup Script (Ready-to-Use)

Create `scripts/backup.sh`:

```bash
#!/bin/bash

# Configuration
PROJECT_NAME="meelike-order"
BACKUP_DIR="$HOME/backups/$PROJECT_NAME"
RETENTION_DAYS=30

# Load environment variables
source .env

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

# Create backup
echo "Creating backup..."
pg_dump "$DATABASE_URL" \
  --file="$BACKUP_FILE" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"

# Delete old backups
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Output result
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
echo "✅ Backup completed: $BACKUP_FILE.gz ($BACKUP_SIZE)"
```

Make it executable:
```bash
chmod +x scripts/backup.sh
```

Run manually:
```bash
./scripts/backup.sh
```

---

## 🚨 Emergency Recovery

### Complete Data Loss Scenario

1. **Stop all writes to database**
   ```bash
   # Disable application
   vercel env rm DATABASE_URL production
   ```

2. **Create new database** (if needed)
   ```bash
   supabase projects create --name meelike-order-recovery
   ```

3. **Restore latest backup**
   ```bash
   psql "$NEW_DATABASE_URL" < backup-latest.sql
   ```

4. **Verify data integrity**
   ```bash
   psql "$NEW_DATABASE_URL" -c "SELECT COUNT(*) FROM \"Case\";"
   ```

5. **Update application connection string**
   ```bash
   vercel env add DATABASE_URL production
   ```

---

## 📊 Monitoring

### Check Backup Status

```bash
# List recent backups
ls -lht ~/backups/meelike-order/ | head -10

# Check last backup time
stat -f "%Sm" ~/backups/meelike-order/backup-*.sql.gz | head -1
```

### Backup Alert (Optional)

Add to `scripts/backup.sh`:

```bash
# Send notification on failure
if [ $? -ne 0 ]; then
  curl -X POST https://api.line.me/v2/bot/message/push \
    -H "Authorization: Bearer $LINE_CHANNEL_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "to": "YOUR_USER_ID",
      "messages": [{"type": "text", "text": "⚠️ Database backup failed!"}]
    }'
fi
```

---

## ✅ Checklist

- [ ] Enable PITR on Supabase (if Pro plan)
- [ ] Set up automated backups (GitHub Actions or cron)
- [ ] Test restore procedure
- [ ] Store backups in multiple locations
- [ ] Set up backup monitoring/alerts
- [ ] Document recovery procedures
- [ ] Schedule monthly disaster recovery drills

---

## 📚 Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)

---

**Last Updated:** December 2024

