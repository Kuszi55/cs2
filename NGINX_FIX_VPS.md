# Nginx Configuration Fix - 413 & 404 Errors

## Problem 1: 413 "Request Entity Too Large"

Nginx odmawia wgrywania dużych plików. Rozwiązanie:

### Na VPS:

```bash
# Edytuj nginx config:
nano /etc/nginx/sites-available/cs2-analysis
```

**Dodaj/zmień tę linię w bloku `server`:**

```nginx
client_max_body_size 1024M;  # Zmień z 500M na 1024M
```

**Kompletny config:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name twoja-domena.com www.twoja-domena.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name twoja-domena.com www.twoja-domena.com;

    ssl_certificate /etc/letsencrypt/live/twoja-domena.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/twoja-domena.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ← DODAJ/ZMIEŃ TĘ LINIĘ ← 
    client_max_body_size 1024M;

    gzip on;
    gzip_types text/plain text/css text/javascript application/json;

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
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Testuj i restart:

```bash
nginx -t        # Sprawdź czy konfiguracja jest OK
systemctl restart nginx
```

---

## Problem 2: 404 "Not Found - nginx"

Gypoteza: Nginx nie ma dobrze skonfigurowanego proxy do Node.js

### Sprawdź czy Node.js działa:

```bash
pm2 status
pm2 logs cs2-analysis

# Sprawdź czy port 3000 słucha:
lsof -i :3000
netstat -tulpn | grep :3000
```

### Jeśli Node nie działa, restart:

```bash
cd /var/www/cs2-analysis
pm2 restart cs2-analysis
pm2 logs cs2-analysis --tail 100
```

### Sprawdź Nginx logs:

```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Jeśli nadal 404:

1. **Sprawdź czy files są w dobrym miejscu:**

```bash
ls -la /var/www/cs2-analysis/
ls -la /var/www/cs2-analysis/dist/spa/
ls -la /var/www/cs2-analysis/dist/server/
```

2. **Upewniaj się że proxy jest prawidłowo konfigurowany:**

```bash
curl http://localhost:3000         # Powinno zwrócić HTML
curl http://localhost:3000/api/ping # Powinno zwrócić JSON: {"message":"ping"}
```

3. **Jeśli proxy works ale 404 w przeglądarce:**

Możliwe że DNS się nie propagował. Czekaj 24-48 godzin lub sprawdź:

```bash
nslookup twoja-domena.com
dig twoja-domena.com
```

---

## Pełny Checklist Jeśli Coś Nie Działa

```bash
# 1. Sprawdź aplikację
pm2 status
pm2 logs cs2-analysis

# 2. Sprawdź port 3000
curl http://localhost:3000

# 3. Sprawdź Nginx
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log

# 4. Sprawdź DNS
nslookup twoja-domena.com

# 5. Sprawdź czy certyfikat SSL działa
openssl s_client -connect twoja-domena.com:443

# 6. Sprawdź firewall
ufw status
# Jeśli trzeba:
ufw allow 80
ufw allow 443
ufw allow 3000

# 7. Restart wszystkiego
systemctl restart nginx
pm2 restart cs2-analysis
```

---

## Jeśli Wszystko Spamięta

**Krok 1:** SSH na VPS
```bash
ssh root@146.59.126.207
```

**Krok 2:** Aktualizuj aplikację
```bash
cd /var/www/cs2-analysis
git pull  # (jeśli używasz Git)
pnpm install
pnpm build
```

**Krok 3:** Uruchom ponownie
```bash
pm2 restart cs2-analysis
```

**Krok 4:** Sprawdź logi
```bash
pm2 logs cs2-analysis
```

---

## Test Upload Lokalnie

Aby przetestować czy upload API działa przed wdrażaniem na VPS:

```bash
# Dev server powinien działać
pnpm dev

# Test upload (z terminalu):
curl -X POST \
  -F "file=@/path/to/demo.dem" \
  http://localhost:8080/api/analyze/upload
```

---

Jeśli i to nie zadziała - napisz dokładny błąd jaki widzisz w `pm2 logs cs2-analysis`
