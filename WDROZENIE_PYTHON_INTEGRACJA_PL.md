# Wdrożenie Integracji Python - Instrukcja Krok po Kroku

## 🎯 Cel

Backend został zaaktualizowany, aby używać skryptu Python do analizy demo. Teraz stats będą **realne**, a nie losowe.

---

## ⚡ Szybkie Wdrożenie (5 minut)

### Krok 1: Połącz się z VPS

```bash
ssh root@146.59.126.207
```

### Krok 2: Przejdź do folderu aplikacji

```bash
cd /var/www/cs2-analysis
```

### Krok 3: Pobierz najnowszy kod

Jeśli masz Git:

```bash
git pull origin main
```

Jeśli wgrywajesz ręcznie, prześlij plik `server/routes/analyze.ts` przez SFTP/SCP.

### Krok 4: Zainstaluj zależności

```bash
pnpm install
```

### Krok 5: Zbuduj aplikację

```bash
pnpm build
```

### Krok 6: Restartuj aplikację

```bash
pm2 restart cs2-analysis
pm2 logs cs2-analysis
```

**GOTOWE!** ✅ Aplikacja teraz używa skryptu Python do analizy.

---

## ✅ Weryfikacja

### Sprawdź czy skrypt Python istnieje

```bash
ls -la /var/www/cs2-analysis/scripts/parse_demo.py
python3 /var/www/cs2-analysis/scripts/parse_demo.py --help
```

### Sprawdź logi aplikacji

```bash
pm2 logs cs2-analysis
```

Szukaj wiadomości:

- ✅ "Executing Python script: /var/www/cs2-analysis/scripts/parse_demo.py"
- ✅ "Python script analysis successful"

### Test wgrywania demo

1. Wgraj plik demo przez interfejs web: `https://twoja-domena.com/dashboard`
2. Sprawdź logi: `pm2 logs cs2-analysis`
3. Weryfikuj że stats pokazują rzeczywiste dane (nie losowe)

---

## 🐛 Rozwiązywanie Problemów

### Błąd: Nie można znaleźć skryptu Python

```bash
# Sprawdź czy plik istnieje
ls -la /var/www/cs2-analysis/scripts/parse_demo.py

# Ustaw uprawnienia
chmod +x /var/www/cs2-analysis/scripts/parse_demo.py
```

### Błąd: Skrypt Python nie działa

```bash
# Test skryptu
python3 /var/www/cs2-analysis/scripts/parse_demo.py /path/to/demo.dem

# Sprawdź pakiety Python
pip3 list | grep -E "demoparser|numpy|scipy|requests"
```

Jeśli brakuje pakietów:

```bash
pip3 install demoparser-py numpy scipy requests
```

### Błąd: Timeout (aplikacja wiesza się)

Skrypt Python ma limit 60 sekund. Duże pliki demo mogą tego przekroczać.

Edytuj `server/routes/analyze.ts` i zmień:

```typescript
timeout: 60000, // Zmień na 120000 (120 sekund)
```

Następnie rebuild i restart:

```bash
cd /var/www/cs2-analysis
pnpm build
pm2 restart cs2-analysis
```

### Błąd: 502 Bad Gateway

```bash
# Sprawdź czy Node.js działa
pm2 status

# Restartuj aplikację
pm2 restart cs2-analysis

# Sprawdź logi
pm2 logs cs2-analysis --tail 50

# Restartuj Nginx
systemctl restart nginx
```

---

## 📊 Co się Zmieniło

### Przed Integracją (Losowe Dane)

```
Map: Mirage (losowa)
Team A: 12
Team B: 8
Players: 10 (losowych)
Stats: Wszystkie random
```

### Po Integracji (Rzeczywiste Dane)

```
Map: Mirage (z pliku demo)
Team A: 16 (rzeczywisty wynik)
Team B: 9 (rzeczywisty wynik)
Players: Rzeczywiste z demo
Stats: Dokładne z analizy Python
Fraud: AI analiza gry każdego gracza
```

---

## 📝 Monitorowanie

### Pokaż logi na bieżąco

```bash
pm2 logs cs2-analysis --tail 100
```

### Monitoruj zasoby

```bash
pm2 monit
```

### Sprawdź status aplikacji

```bash
pm2 status
```

---

## 🔄 Rollback (jeśli coś pójdzie nie tak)

```bash
cd /var/www/cs2-analysis
git revert HEAD          # Powróć do poprzedniej wersji
pnpm build
pm2 restart cs2-analysis
```

---

## 📋 Checklist

- [ ] Skrypt Python istnieje: `/var/www/cs2-analysis/scripts/parse_demo.py`
- [ ] Pakiety Python zainstalowane: `demoparser-py`, `numpy`, `scipy`, `requests`
- [ ] Kod zbudowany: `pnpm build`
- [ ] Aplikacja restartowana: `pm2 restart cs2-analysis`
- [ ] Logi sprawdzone: `pm2 logs cs2-analysis`
- [ ] Test wgrania demo - stats są rzeczywiste
- [ ] Fraud assessments są wypełnione

---

## 🔧 Konfiguracja (Opcjonalnie)

### Zmiana timeout (jeśli demo analizuje się długo)

W pliku `server/routes/analyze.ts` zmień:

```typescript
timeout: 60000, // Domyślnie 60 sekund
// na
timeout: 120000, // 120 sekund
```

### Zmiana ścieżki skryptu

Jeśli skrypt jest w innym miejscu:

```typescript
const pythonScriptPath = "/nowa/sciezka/parse_demo.py";
```

---

## 📞 Wsparcie

Jeśli problemy się utrzymują:

```bash
# 1. Pełne logi
pm2 logs cs2-analysis

# 2. Test skryptu Python
python3 /var/www/cs2-analysis/scripts/parse_demo.py /test/demo.dem

# 3. Sprawdź zasoby
htop

# 4. Sprawdź błędy Nginx
tail -f /var/log/nginx/error.log
```

---

## 🎉 Wiadomości Powodzenia w Logach

Szukaj tych wiadomości:

```
Upload received: { filename: 'demo.dem', size: 5242880, path: '...' }
File metadata: { fileSize: 5242880, fileSizeMB: '5.00' }
Executing Python script: /var/www/cs2-analysis/scripts/parse_demo.py with file: /...
Python script analysis successful for: demo.dem
```

Jeśli widzisz te wiadomości = **WSZYSTKO DZIAŁA!** ✅

---

## ⚠️ Komunikaty o Fallback

Jeśli widzisz:

```
Python script execution failed, falling back to DemoAnalyzer
```

To oznacza, że Python script nie działa, ale aplikacja dalej analizuje (mniej dokładnie).

Sprawdź Python script i pakiety.

---

## Podsumowanie

**Zrobione:**
✅ Kod zmodyfikowany  
✅ Dev server restart  
✅ Ready do wdrożenia

**Dalej:**

1. Pobierz kod: `git pull origin main`
2. Zbuduj: `pnpm build`
3. Restartuj: `pm2 restart cs2-analysis`
4. Sprawdź logi: `pm2 logs cs2-analysis`

**GOTOWE!** 🚀

---

**Data**: 2024  
**Status**: Gotowe do wdrożenia
