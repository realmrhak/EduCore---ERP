#!/bin/bash
# MongoDB Backup Script

# Configurations
BACKUP_DIR="./backups"
DB_NAME="educore"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${DB_NAME}_backup_${TIMESTAMP}"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Execute mongodump
echo "Starting database backup for ${DB_NAME}..."
mongodump --db="${DB_NAME}" --out="${BACKUP_DIR}/${BACKUP_NAME}"

# Compress backup
if [ $? -eq 0 ]; then
  echo "Backup completed successfully. Compressing..."
  tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
  rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"
  echo "Backup saved as: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
else
  echo "Error: Database backup failed."
  exit 1
fi
