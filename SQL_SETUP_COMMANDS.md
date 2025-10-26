# SQL Setup Commands - CS2 Analyzer

## Jak użyć:

1. Połącz się z MySQL:

```bash
mysql -h 193.111.250.106 -u u7446_mA85o7u3lr -p
# Wpisz hasło: f9bsHnJ6vj@7vl^@7ctG.emh
```

2. Wpisz komendę:

```sql
USE s7446_ZENIT;
```

3. Skopiuj CAŁĄ zawartość z pliku `DATABASE_SETUP.sql` (znajduje się w repozytorium)

4. Wklej do konsoli MySQL i naciśnij Enter

---

## Alternatywnie - wgranie z pliku:

Jeśli masz plik `DATABASE_SETUP.sql` na komputerze:

```bash
mysql -h 193.111.250.106 -u u7446_mA85o7u3lr -p s7446_ZENIT < DATABASE_SETUP.sql
```

Wpisz hasło: `f9bsHnJ6vj@7vl^@7ctG.emh`

---

## Sprawdzenie czy tabele zostały utworzone:

```bash
mysql -h 193.111.250.106 -u u7446_mA85o7u3lr -p s7446_ZENIT -e "SHOW TABLES;"
```

Powinieneś zobaczyć następujące tabele:

- analysis_logs
- clips
- fraud_assessment
- game_events
- matches
- players
- player_stats
- suspicious_activities

---

## Dane dostępowe do bazy:

- **Host**: 193.111.250.106:3306
- **Użytkownik**: u7446_mA85o7u3lr
- **Hasło**: f9bsHnJ6vj@7vl^@7ctG.emh
- **Baza**: s7446_ZENIT

---

## Notatka o zawartości DATABASE_SETUP.sql:

Plik zawiera:

- ✅ Tabelę `matches` (informacje o meczach)
- ✅ Tabelę `players` (gracze w meczach)
- ✅ Tabelę `player_stats` (statystyki graczy)
- ✅ Tabelę `suspicious_activities` (podejrzane aktywności)
- ✅ Tabelę `fraud_assessment` (ocena oszustwa)
- ✅ Tabelę `game_events` (zdarzenia w grze)
- ✅ Tabelę `clips` (klipy z podejrzanych momentów)
- ✅ Tabelę `analysis_logs` (logi analizy)
- ✅ Odpowiednie indeksy i relacje

Wszystko jest gotowe do produkcji!
