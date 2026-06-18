FROM postgres:15-alpine

# Install cron
RUN apk add --no-cache dcron

# Create backup directory
RUN mkdir -p /docker/backups

# Copy backup script
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Setup cron job
# Run daily at 2:00 AM
RUN echo "0 2 * * * /usr/local/bin/backup.sh daily >> /var/log/backup.log 2>&1" > /etc/crontabs/root
# Run weekly on Sunday at 3:00 AM
RUN echo "0 3 * * 0 /usr/local/bin/backup.sh weekly >> /var/log/backup.log 2>&1" >> /etc/crontabs/root

CMD ["crond", "-f", "-d", "8"]
