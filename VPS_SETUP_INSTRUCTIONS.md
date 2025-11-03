# 🚀 VPS Setup Instructions - Clip Generation System

## KROK 1: Utwórz folder na klipy

```bash
mkdir -p /var/www/cs2-analysis/clips
chmod 755 /var/www/cs2-analysis/clips
chmod +x /var/www/cs2-analysis/clips

# Verify
ls -la /var/www/cs2-analysis/ | grep clips
```

---

## KROK 2: SQL Migration - Dodaj nową tabelę

Uruchom w MySQL/MariaDB:

```sql
-- Tabela na suspicious clips (metadata)
CREATE TABLE IF NOT EXISTS suspicious_clips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matchId INT NOT NULL,
  playerName VARCHAR(255) NOT NULL,
  teamName VARCHAR(255),
  suspicionType VARCHAR(100), -- wallhack, reaction_time, aim_lock, impossible_angle, damage_burst, grenade_spam, unusual_positioning
  description TEXT,
  confidence FLOAT,
  tick_start INT,
  tick_end INT,
  estimatedDuration INT,
  videoPath VARCHAR(500),
  thumbnailPath VARCHAR(500),
  fileSize BIGINT,
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_matchId (matchId),
  INDEX idx_playerName (playerName)
);

-- Tabela na clip generation settings (cache)
CREATE TABLE IF NOT EXISTS clip_generation_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matchId INT NOT NULL,
  requestedBy VARCHAR(255),
  numClips INT,
  sensitivity INT, -- 1-5 (1=csak obvious, 5=wszystko)
  status VARCHAR(50), -- pending, processing, completed, failed
  totalClipsGenerated INT DEFAULT 0,
  startedAt TIMESTAMP NULL,
  completedAt TIMESTAMP NULL,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_status (status)
);
```

---

## KROK 3: Zamień Go Binary

Plik: `cs2json_corrected.go` (już masz)

```bash
cd /var/www/cs2-analysis/

# Backup old version
cp cs2json.go cs2json.go.backup

# Use corrected version
cp cs2json_corrected.go cs2json.go

# Compile
go build -o scripts/cs2json cs2json.go

# Test
./scripts/cs2json /path/to/demo.dem | head -20
```

---

## KROK 4: Install Python Dependencies

```bash
pip3 install opencv-python pillow numpy scipy

# Verify ffmpeg
ffmpeg -version
```

---

## KROK 5: Create Clip Generation Script

Create file: `/var/www/cs2-analysis/scripts/generate_clips.py`

[Script będzie podany w następnym kroku]

---

## KROK 6: Update Backend Routes

- Add new API endpoints in `server/routes/clips.ts`
- Add clip generation handler
- Add admin deletion handler

[Kod będzie podany]

---

## KROK 7: Database Connection

Ensure your `.env` or config has:
```
DATABASE_URL=mysql://user:password@localhost:3306/cs2analysis
NODE_ENV=production
```

---

## ✅ Verification

```bash
# Check folder permissions
ls -la /var/www/cs2-analysis/clips

# Check database tables
mysql -u your_user -p your_database -e "SHOW TABLES LIKE 'suspicious%';"

# Test Go binary
./scripts/cs2json /path/to/demo.dem | python3 -m json.tool | head -30
```

---

## 📊 Expected Output from Go Binary

```json
{
  "success": true,
  "map": "Mirage",
  "players": [...],
  "suspiciousMoments": [
    {
      "playerName": "s1mple",
      "suspicionType": "wallhack",
      "description": "Player aimed at enemy through wall",
      "confidence": 0.87,
      "tick_start": 5234,
      "tick_end": 5240,
      "estimatedDuration": 3
    },
    {
      "playerName": "NiKo",
      "suspicionType": "reaction_time",
      "description": "Reaction time too fast (34ms)",
      "confidence": 0.92,
      "tick_start": 8234,
      "tick_end": 8236,
      "estimatedDuration": 2
    }
  ]
}
```

---

## 🎯 Workflow

1. User uploads demo
2. Go binary parses + detects suspicious moments
3. Python script waits for user request (not auto-generated)
4. User clicks "Generate Clips" in UI
5. Modal: Choose num clips (1-15) + sensitivity (1-5)
6. Backend processes: calls `generate_clips.py`
7. Python script:
   - Extracts tick data for each moment
   - Converts to PNG frames (ffmpeg)
   - Renders MP4 (1080p 60fps)
   - Saves to `/var/www/cs2-analysis/clips/{matchId}/`
   - Updates database with metadata
8. Frontend displays videos in Clips tab

---

## 💾 Storage Estimation

- 1080p 60fps, 5 sec clip ≈ 50-80MB
- 15 clips per match = 750MB-1.2GB per match
- Recommend: SSD with 500GB+ for clips

---

## 🔧 Troubleshooting

**ffmpeg errors:**
```bash
ffmpeg -version
apt-get install ffmpeg
```

**Python errors:**
```bash
pip3 install opencv-python pillow numpy scipy
```

**Database errors:**
```bash
mysql -u root -p
USE cs2analysis;
SHOW TABLES;
```

**Folder permissions:**
```bash
chmod 755 /var/www/cs2-analysis/clips
chmod +x /var/www/cs2-analysis/clips
```

---

Done! Ready for next steps? 🚀
