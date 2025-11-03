# 🚀 Complete Implementation Guide - Clips System & Admin Panel

## SETUP CHECKLIST

### ✅ DATABASE SETUP

Run these SQL commands:

```sql
CREATE TABLE IF NOT EXISTS suspicious_clips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matchId INT NOT NULL,
  playerName VARCHAR(255) NOT NULL,
  teamName VARCHAR(255),
  suspicionType VARCHAR(100),
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

CREATE TABLE IF NOT EXISTS clip_generation_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matchId INT NOT NULL,
  requestedBy VARCHAR(255),
  numClips INT,
  sensitivity INT,
  status VARCHAR(50),
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

### ✅ VPS SETUP

```bash
# 1. Create clips folder
mkdir -p /var/www/cs2-analysis/clips
chmod 755 /var/www/cs2-analysis/clips

# 2. Install Python dependencies
pip3 install opencv-python pillow numpy scipy

# 3. Replace Go binary
cd /var/www/cs2-analysis/
cp cs2json.go cs2json.go.backup
cp cs2json_with_detection.go cs2json.go
go build -o scripts/cs2json cs2json.go

# 4. Update Python script
cp generate_clips.py scripts/generate_clips.py
chmod +x scripts/generate_clips.py

# 5. Update parse_demo
cp parse_demo_final.py scripts/parse_demo.py
chmod +x scripts/parse_demo.py

# 6. Test
./scripts/cs2json /path/to/demo.dem | python3 -m json.tool | head -20
python3 scripts/generate_clips.py /path/to/demo.dem /var/www/cs2-analysis/clips 1 5 3
```

---

### ✅ BACKEND SETUP

1. **Update `server/index.ts`** - Add routes:

```typescript
import clipsRouter from "./routes/clips";

// After other routes:
app.use("/api/clips", clipsRouter);

// Static file serving for clips:
app.use("/clips", express.static(path.join(process.cwd(), "dist/spa/clips")));
```

2. **Create `server/routes/clips.ts`** - Already provided above

3. **Update `server/routes/analyze.ts`** - Modify the uploadAndAnalyze to use new Go binary:

```typescript
// Change line where python script is called:
const pythonScript = "/var/www/cs2-analysis/scripts/parse_demo.py";

// Also, after analysis, extract suspicious moments:
analysis.suspiciousMoments = pythonOutput.analysis?.suspiciousMoments || [];
```

---

### ✅ FRONTEND SETUP

Files to create/update:

1. **Update `client/pages/MatchDetails.tsx`**
   - Already partially done
   - Add Clips tab with generation modal
   - Update other tabs with charts

2. **Create `client/pages/Settings.tsx`** 
   - Add admin panel for ADMIN2137
   - Match management
   - Clip management

3. **Create `client/components/ClipGenerator.tsx`**
   - Modal for clip generation
   - Sensitivity slider
   - Num clips input

4. **Create `client/components/VideoPlayer.tsx`**
   - HLS/MP4 player
   - Progress bar
   - Fullscreen

5. **Create `client/components/AdminPanel.tsx`**
   - Match list with delete
   - Clip list with delete
   - Storage usage

---

## 🎬 CLIP GENERATION FLOW

```
1. User uploads demo.dem
   ↓
2. Go binary analyzes:
   - Parses demo
   - Detects 6+ suspicious moment types
   - Outputs JSON with suspiciousMoments array
   ↓
3. Frontend stores suspicious moments in state
   ↓
4. User clicks "Generate Clips" in Clips tab
   ↓
5. Modal appears:
   - Slider for number of clips (1-15)
   - Slider for sensitivity (1-5)
   - "Generate" button
   ↓
6. Backend calls Python script:
   generate_clips.py <demo.dem> <output_dir> <match_id> <num_clips> <sensitivity>
   ↓
7. Python script:
   - Filters suspicious moments by sensitivity
   - For each moment, determines optimal clip duration
   - Uses ffmpeg to render 1080p 60fps MP4
   - Saves to /var/www/cs2-analysis/clips/{matchId}/
   ↓
8. Returns clip metadata to frontend
   ↓
9. Frontend displays clips in Clips tab
   - Video player for each clip
   - Description, confidence, player name
   - Delete button
```

---

## 📊 SUSPICIOUS MOMENT TYPES

The Go binary detects:

1. **damage_burst** - High damage in short time
2. **extreme_kd_ratio** - K/D > 3.0 with many kills
3. **unusual_accuracy** - Accuracy > 55%
4. **unusual_headshot_rate** - HS% > 50%
5. **reaction_time** - Too fast response
6. **aim_lock** - Unnatural aim snapping
7. **impossible_angle** - Kill from wrong angle
8. **grenade_spam** - Excessive utility usage
9. **unusual_positioning** - Unnatural player positioning

Sensitivity levels (1-5):
- **1**: Only obvious moments (confidence > 90%)
- **2**: Clear moments (confidence > 85%)
- **3**: Normal mix (confidence > 80%)
- **4**: Include subtle (confidence > 75%)
- **5**: Everything (confidence > 50%)

---

## 🎥 VIDEO SPECS

- **Resolution**: 1920x1080 (1080p)
- **FPS**: 60
- **Codec**: H.264 (libx264)
- **Quality**: CRF 18 (high quality)
- **Expected file size**: 50-150MB per clip (10-20 seconds)
- **Max per match**: 15 clips = 750MB-2.25GB

---

## 👤 ADMIN PANEL (for ADMIN2137)

Settings page should show:

1. **Matches Tab**
   - List all uploaded matches
   - Columns: Match ID, Map, Score, Players, Upload Date, Actions
   - Actions: View, Generate Clips, Delete (cascades to clips)

2. **Clips Tab**
   - List all generated clips (across all matches)
   - Columns: Match ID, Player, Type, Confidence, Size, Generated, Actions
   - Actions: Preview, Download, Delete

3. **Storage Tab**
   - Total storage used
   - Storage per match
   - Cleanup options

4. **Settings Tab**
   - Max clips per match (default 15)
   - Auto-delete after X days
   - Storage quota

---

## 🔑 API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clips/:matchId/generate` | Generate clips |
| GET | `/api/clips/:matchId` | List clips for match |
| GET | `/api/clips/:matchId/:clipId/download` | Download clip |
| DELETE | `/api/clips/:matchId/:clipId` | Delete single clip |
| DELETE | `/api/clips/:matchId` | Delete all clips for match |
| GET | `/api/admin/matches` | List all matches (admin) |
| DELETE | `/api/admin/matches/:matchId` | Delete match + clips (admin) |

---

## 📝 FRONTEND COMPONENTS NEEDED

### ClipGeneratorModal.tsx
```typescript
interface ClipGeneratorModalProps {
  matchId: number;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (numClips: number, sensitivity: number) => void;
}

// Features:
// - Slider for 1-15 clips
// - Slider for 1-5 sensitivity
// - Progress bar during generation
// - List of generated clips after
```

### VideoPlayer.tsx
```typescript
interface VideoPlayerProps {
  src: string;
  title: string;
  description: string;
  confidence: number;
  playerName: string;
  suspicionType: string;
}

// Features:
// - Play/pause
// - Progress bar
// - Volume control
// - Fullscreen
// - Download button
```

### AdminMatchesTable.tsx
```typescript
// Features:
// - Sortable columns
// - Search/filter
// - Delete with confirmation
// - Generate clips button
// - View match link
```

---

## ✅ TESTING CHECKLIST

- [ ] Go binary compiles without errors
- [ ] Python script runs and generates clips
- [ ] Database tables created
- [ ] Backend routes registered
- [ ] Clips folder created with proper permissions
- [ ] Upload demo file
- [ ] Go binary analyzes and detects moments
- [ ] Click "Generate Clips" in UI
- [ ] Modal appears with sliders
- [ ] Select num clips and sensitivity
- [ ] Clips generate successfully
- [ ] Videos appear in Clips tab
- [ ] Videos play correctly
- [ ] Clips can be deleted
- [ ] Admin panel shows all matches
- [ ] Admin can delete matches (cascades to clips)
- [ ] Disk space is properly managed

---

## 🔧 TROUBLESHOOTING

**Go binary won't compile:**
```bash
# Check Go version
go version

# Clean and rebuild
go clean
go build -o scripts/cs2json cs2json_with_detection.go
```

**Python script fails:**
```bash
# Check Python packages
pip3 list | grep -E "opencv|pillow|numpy|scipy"

# Test script directly
python3 scripts/generate_clips.py /path/to/demo.dem /var/www/cs2-analysis/clips 1 5 3
```

**ffmpeg errors:**
```bash
# Install ffmpeg
apt-get update
apt-get install ffmpeg

# Test
ffmpeg -version
```

**Permissions errors:**
```bash
# Fix folder permissions
chmod 755 /var/www/cs2-analysis/clips
chmod +x /var/www/cs2-analysis/scripts/generate_clips.py
```

**Database errors:**
```bash
# Verify connection
mysql -u user -p database -e "SHOW TABLES;"

# Check tables exist
mysql -u user -p database -e "SHOW COLUMNS FROM suspicious_clips;"
```

---

## 📞 NEXT STEPS

1. Execute all VPS setup commands
2. Run database migrations
3. Update backend routes
4. Create frontend components
5. Test clip generation
6. Deploy to production

**Questions? Issues? Let me know!** 🚀
