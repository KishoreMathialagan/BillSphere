#!/bin/sh

BACKUP_TYPE=$1
if [ -z "$BACKUP_TYPE" ]; then
    BACKUP_TYPE="manual"
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/docker/backups"
FILENAME="${BACKUP_DIR}/billsphere_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"

echo "Starting ${BACKUP_TYPE} backup at $(date)..."

# Export password for pg_dump
export PGPASSWORD=$POSTGRES_PASSWORD

# Perform compressed backup
pg_dump -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER $POSTGRES_DB | gzip > $FILENAME

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $FILENAME"
else
    echo "Backup failed!"
    exit 1
fi

# Apply retention policies
echo "Cleaning up old backups..."

# Keep daily backups for 30 days
find $BACKUP_DIR -name "billsphere_daily_*.sql.gz" -type f -mtime +30 -delete

# Keep weekly backups for 84 days (12 weeks)
find $BACKUP_DIR -name "billsphere_weekly_*.sql.gz" -type f -mtime +84 -delete

echo "Cleanup completed."
