# CS2 Analyzer - Uproszczony Przewodnik VPS

**Czas: ~20 minut | Hosting: 146.59.126.207**

---

## KROK 1: Połącz się z VPS (2 min)

```bash
ssh root@146.59.126.207
```

Wpisz hasło do root'a (jeśli pytane).

---

## KROK 2: Zainstaluj wymagane narzędzia (5 min)

```bash
apt update && apt upgrade -y
apt install -y curl wget git nodejs npm nginx certbot python3-certbot-nginx
```

Czekaj, aż się zainstaluje.

---

## KROK 3: Zainstaluj pnpm i PM2 (2 min)

```bash
npm install -g pnpm pm2
```

---

## KROK 4: Przygotuj aplikację (3 min)

```bash
cd /var/www
git clone <TWOJA_REPO_URL> cs2-analysis
cd cs2-analysis
pnpm install
pnpm build
```

> Zastąp `<TWOJA_REPO_URL>` linkiem do Twojego repozytorium Git

Jeśli nie masz Gita, wgraj pliki FTP/SFTP do `/var/www/cs2-analysis/`

---

## KROK 5: Konfiguruj bazy danych (5 min)

### Podłącz się do MySQL:

```bash
mysql -h 193.111.250.106 -u u7446_mA85o7u3lr -p
# Wpisz hasło: f9bsHnJ6vj@7vl^@7ctG.emh
```

### Wpisz w konsoli MySQL:

```sql
USE s7446_ZENIT;

-- Wklej całą zawartość z pliku DATABASE_SETUP.sql
-- (Cały plik SQL z projektu)
```

---

## KROK 6: Uruchom aplikację z PM2 (2 min)

```bash
cd /var/www/cs2-analysis

# Utwórz plik ecosystem.config.js:
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cs2-analysis',
    script: './dist/server/node-build.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
};
EOF

# Uruchom:
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

---

## KROK 7: Skonfiguruj Nginx (3 min)

### Utwórz config Nginx:

```bash
cat > /etc/nginx/sites-available/cs2-analysis << 'EOF'
server {
    listen 80;
    server_name twoja-domena.com www.twoja-domena.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name twoja-domena.com www.twoja-domena.com;
    
    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Włącz stronę:
ln -s /etc/nginx/sites-available/cs2-analysis /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

> Zastąp `twoja-domena.com` Twoją rzeczywistą domeną!

---

## KROK 8: Skonfiguruj SSL (Let's Encrypt) (2 min)

```bash
certbot certonly --nginx -d twoja-domena.com -d www.twoja-domena.com
```

Postępuj zgodnie z instrukcjami.

Zaktualizuj config Nginx ścieżkami z certbota (będą wyświetlone).

---

## KROK 9: Wskaż domenę na VPS (W panelu domeny)

Przejdź do ustawień DNS Twojej domeny i dodaj:

```
A Record:    twoja-domena.com      →  146.59.126.207
A Record:    www.twoja-domena.com  →  146.59.126.207
```

Czekaj 24-48 godzin na propagację DNS.

---

## KROK 10: Sprawdź czy działa

```bash
# Sprawdź status aplikacji:
pm2 status

# Pokaż logi:
pm2 logs cs2-analysis

# Test Nginx:
curl http://localhost:3000
```

Po propagacji DNS wejdź na: `https://twoja-domena.com`

---

## SZYBKIE KOMENDY

```bash
# Restart aplikacji
pm2 restart cs2-analysis

# Pokaż logi real-time
pm2 logs cs2-analysis --tail 50

# Monitoruj zasoby
pm2 monit

# Połącz z bazą
mysql -h 193.111.250.106 -u u7446_mA85o7u3lr -p

# Sprawdź czy port 3000 działa
lsof -i :3000
```

---

## TROUBLESHOOTING

### "Connection refused on port 3000"
```bash
pm2 restart cs2-analysis
pm2 logs cs2-analysis
```

### "502 Bad Gateway w przeglądarce"
```bash
# Sprawdź czy Node.js działa:
pm2 status

# Restart Nginx:
systemctl restart nginx
```

### "Błąd przy wgrywaniu dema"
- Sprawdź uprawnienia `/var/www/cs2-analysis/dist/spa/uploads`:
```bash
mkdir -p /var/www/cs2-analysis/dist/spa/uploads
chmod 755 /var/www/cs2-analysis/dist/spa/uploads
```

### "Błąd połączenia z bazą"
```bash
# Test połączenia:
mysql -h 193.111.250.106 -u u7446_mA85o7u3lr -p s7446_ZENIT

# Sprawdź firewall:
ufw status
ufw allow 3306/tcp
```

---

## AKTUALIZACJA APLIKACJI PÓŹNIEJ

```bash
cd /var/www/cs2-analysis
git pull origin main
pnpm install
pnpm build
pm2 restart cs2-analysis
```

---

## BACKUP

```bash
# Backup bazy:
mysqldump -h 193.111.250.106 -u u7446_mA85o7u3lr -p s7446_ZENIT > backup.sql

# Backup aplikacji:
tar -czf backup_app.tar.gz /var/www/cs2-analysis
```

---

## WSKAZÓWKI BEZPIECZEŃSTWA

1. **Zmień hasło root'a** po wdrażaniu
2. **Wyłącz SSH dla root'a** (`PermitRootLogin no` w `/etc/ssh/sshd_config`)
3. **Zainstaluj Fail2ban** (ochrona przed brute force):
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   ```

---

✅ **GOTOWE!** Aplikacja powinna być dostępna na `https://twoja-domena.com`

Jeśli coś nie działa, sprawdź logi:
```bash
pm2 logs cs2-analysis
tail -f /var/log/nginx/error.log
```
