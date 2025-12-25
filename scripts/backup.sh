#!/bin/bash

# MIMS Database Backup Script
# This script creates a compressed backup of the PostgreSQL database

set -e  # Exit on error

# Configuration
PROJECT_NAME="meelike-order"
BACKUP_DIR="$HOME/backups/$PROJECT_NAME"
RETENTION_DAYS=30

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not set in .env${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"

echo -e "${YELLOW}🔄 Creating database backup...${NC}"

# Create backup using pg_dump
pg_dump "$DATABASE_URL" \
  --file="$BACKUP_FILE" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  2>&1

# Check if backup was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backup failed!${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
gzip "$BACKUP_FILE"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)

# Delete old backups
echo -e "${YELLOW}🧹 Cleaning old backups (older than $RETENTION_DAYS days)...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)

# Output result
echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "   📁 File: $BACKUP_FILE.gz"
echo -e "   📊 Size: $BACKUP_SIZE"
echo -e "   🗑️  Deleted: $DELETED_COUNT old backup(s)"
echo ""

# List recent backups
echo -e "${YELLOW}📋 Recent backups:${NC}"
ls -lht "$BACKUP_DIR" | head -6

exit 0

