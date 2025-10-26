# CS2 Demo Analysis Platform - VPS Deployment Guide

This guide covers deploying the CS2 Demo Analysis application on your VPS with the following specifications:
- **IPv4**: 146.59.126.207
- **IPv6**: 2001:41d0:601:1100::66e9
- **Storage**: 75GB
- **OS**: Ubuntu 20.04 LTS (recommended)

## Prerequisites
Before starting, ensure you have SSH access to your VPS and admin/root privileges.

---

## Step 1: Initial Server Setup

### 1.1 Connect to your VPS
```bash
ssh root@146.59.126.207
```

### 1.2 Update system packages
```bash
apt update && apt upgrade -y
```

### 1.3 Install essential tools
```bash
apt install -y curl wget git build-essential htop net-tools
```

### 1.4 Configure firewall (UFW)
```bash
ufw enable
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw status
```

---

## Step 2: Install Node.js and npm

### 2.1 Install Node.js 20 LTS (recommended for this project)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

### 2.2 Install pnpm (package manager used by this project)
```bash
npm install -g pnpm
pnpm --version
```

### 2.3 Verify installations
```bash
node --version
npm --version
pnpm --version
```

---

## Step 3: Set Up Application Directory

### 3.1 Create application directory
```bash
mkdir -p /var/www/cs2-analysis
cd /var/www/cs2-analysis
```

### 3.2 Clone or upload your project
**Option A: Clone from Git (if using Git)**
```bash
git clone https://your-repo-url.git .
```

**Option B: Upload files manually**
- Use SCP or SFTP to upload your project files to `/var/www/cs2-analysis`

### 3.3 Install dependencies
```bash
cd /var/www/cs2-analysis
pnpm install
```

### 3.4 Build the application
```bash
pnpm build
```

This creates two directories:
- `dist/spa` - Frontend (React) build
- `dist/server` - Backend (Express) build

---

## Step 4: Install and Configure PM2 (Process Manager)

PM2 keeps your application running and automatically restarts it if it crashes.

### 4.1 Install PM2 globally
```bash
npm install -g pm2
```

### 4.2 Create PM2 ecosystem configuration
Create `/var/www/cs2-analysis/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'cs2-analysis',
      script: './dist/server/node-build.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/cs2-analysis-error.log',
      out_file: '/var/log/cs2-analysis-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

### 4.3 Start the application with PM2
```bash
cd /var/www/cs2-analysis
pm2 start ecosystem.config.js
```

### 4.4 Set PM2 to start on system boot
```bash
pm2 startup
pm2 save
```

### 4.5 Monitor the application
```bash
pm2 logs cs2-analysis
pm2 status
```

---

## Step 5: Set Up Nginx as Reverse Proxy

Nginx will handle HTTP/HTTPS traffic and forward requests to your Node.js application.

### 5.1 Install Nginx
```bash
apt install -y nginx
```

### 5.2 Create Nginx configuration
Create `/etc/nginx/sites-available/cs2-analysis`:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (we'll set this up with Let's Encrypt next)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;

    # Client body size limit for demo file uploads (adjust based on demo file size)
    client_max_body_size 500M;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for file upload
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 5.3 Enable the site
```bash
ln -s /etc/nginx/sites-available/cs2-analysis /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

---

## Step 6: Set Up SSL with Let's Encrypt

### 6.1 Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL certificate
Replace `your-domain.com` with your actual domain:
```bash
certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 6.3 Set up automatic renewal
```bash
systemctl enable certbot.timer
systemctl start certbot.timer
certbot renew --dry-run  # Test renewal
```

---

## Step 7: Configure Environment Variables

Create `/var/www/cs2-analysis/.env.production`:
```bash
NODE_ENV=production
PORT=3000
```

Load environment variables before starting the app:
```bash
cd /var/www/cs2-analysis
source .env.production
pm2 restart ecosystem.config.js
```

---

## Step 8: Set Up Log Rotation

Create `/etc/logrotate.d/cs2-analysis`:
```
/var/log/cs2-analysis-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
}
```

---

## Step 9: Domain Configuration

### 9.1 Point your domain to the VPS
Update your domain's DNS records:
- **A Record**: `your-domain.com` → `146.59.126.207`
- **AAAA Record**: `your-domain.com` → `2001:41d0:601:1100::66e9`
- **A Record**: `www.your-domain.com` → `146.59.126.207`
- **AAAA Record**: `www.your-domain.com` → `2001:41d0:601:1100::66e9`

Wait 24-48 hours for DNS propagation.

### 9.2 Verify DNS
```bash
nslookup your-domain.com
```

---

## Step 10: Deployment Updates

When you need to update the application:

### 10.1 Pull latest changes
```bash
cd /var/www/cs2-analysis
git pull origin main  # if using git
```

### 10.2 Install dependencies
```bash
pnpm install
```

### 10.3 Build the application
```bash
pnpm build
```

### 10.4 Restart the application
```bash
pm2 restart cs2-analysis
```

### 10.5 Check status
```bash
pm2 logs cs2-analysis
pm2 status
```

---

## Step 11: Monitoring and Maintenance

### 11.1 Monitor system resources
```bash
htop
df -h  # Disk usage
free -h  # Memory usage
```

### 11.2 View application logs
```bash
pm2 logs cs2-analysis
pm2 logs cs2-analysis --tail 100  # Last 100 lines
```

### 11.3 Monitor application performance
```bash
pm2 monit
```

### 11.4 Check Nginx status
```bash
systemctl status nginx
journalctl -u nginx -f  # Real-time logs
```

---

## Step 12: Backup Strategy

### 12.1 Create backup directory
```bash
mkdir -p /backups/cs2-analysis
```

### 12.2 Create backup script
Create `/usr/local/bin/backup-cs2.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/cs2-analysis/backup_$DATE.tar.gz"
tar -czf $BACKUP_FILE /var/www/cs2-analysis
echo "Backup created: $BACKUP_FILE"
find /backups/cs2-analysis -type f -mtime +30 -delete  # Keep last 30 days
```

### 12.3 Make script executable
```bash
chmod +x /usr/local/bin/backup-cs2.sh
```

### 12.4 Set up cron job (daily backups at 2 AM)
```bash
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-cs2.sh
```

---

## Troubleshooting

### Application won't start
```bash
pm2 logs cs2-analysis
pm2 delete cs2-analysis
cd /var/www/cs2-analysis
pm2 start ecosystem.config.js
```

### Port already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Nginx 502 Bad Gateway
```bash
# Check if Node.js is running
pm2 status
pm2 restart cs2-analysis
# Check Nginx logs
tail -f /var/log/nginx/error.log
```

### SSL certificate issues
```bash
certbot renew --force-renewal
```

### High memory usage
```bash
pm2 restart cs2-analysis
# Or increase swap space if needed
```

---

## Security Recommendations

1. **Keep system updated**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Disable root SSH login**
   Edit `/etc/ssh/sshd_config`: Set `PermitRootLogin no`

3. **Use SSH keys instead of passwords**
   ```bash
   ssh-copy-id -i ~/.ssh/id_rsa.pub user@146.59.126.207
   ```

4. **Install and configure Fail2ban**
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   ```

5. **Regular updates**
   ```bash
   apt install -y unattended-upgrades
   ```

---

## Performance Optimization

1. **Enable HTTP/2 and gzip** - Already configured in Nginx
2. **Set appropriate Node.js cluster instances** - Configured in ecosystem.config.js
3. **Monitor and optimize database queries** - If using a database
4. **Use CDN for static assets** - Consider CloudFlare or similar
5. **Regular backups** - Automated with cron job

---

## Support and Additional Resources

- PM2 Documentation: https://pm2.keymetrics.io/
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
- Node.js Best Practices: https://nodejs.org/en/docs/

---

## Quick Start Summary

```bash
# 1. Connect to VPS
ssh root@146.59.126.207

# 2. Setup (run once)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs nginx certbot python3-certbot-nginx ufw
npm install -g pnpm pm2

# 3. Deploy application
git clone <your-repo> /var/www/cs2-analysis
cd /var/www/cs2-analysis
pnpm install && pnpm build

# 4. Configure and start
# Update Nginx config with your domain
# Run certbot for SSL
pm2 start ecosystem.config.js
pm2 startup && pm2 save

# 5. Your app is live at https://your-domain.com
```

---

**Last Updated**: 2024
**Version**: 1.0
