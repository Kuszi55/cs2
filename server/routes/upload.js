const express = require('express');
const multer  = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const uploadDir = path.resolve(__dirname, '..', 'dist', 'spa', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + Math.random().toString(36).slice(2,9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB

router.post('/api/upload-demo', upload.single('demo'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
  const demoPath = path.join(uploadDir, req.file.filename);
  const parser = path.resolve(__dirname, '..', 'scripts', 'parse_demo.py');

  const py = spawn('python3', [parser, demoPath], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout='', stderr='';
  const timer = setTimeout(() => py.kill('SIGKILL'), 120000);

  py.stdout.on('data', c => stdout += c.toString());
  py.stderr.on('data', c => stderr += c.toString());

  py.on('close', code => {
    clearTimeout(timer);
    if (code !== 0) return res.status(500).json({ success:false, error: stderr || 'parser failed' });
    try { return res.json(JSON.parse(stdout)); }
    catch (e) { return res.status(500).json({ success:false, error:'Invalid JSON from parser', raw: stdout }); }
  });

  py.on('error', err => { clearTimeout(timer); return res.status(500).json({ success:false, error: String(err) }); });
});

module.exports = router;
