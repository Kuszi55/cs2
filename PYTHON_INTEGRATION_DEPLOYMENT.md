# Python Demo Parsing Integration - Deployment Guide

This guide covers deploying the updated Node.js backend that integrates with the Python demo parsing script on your VPS.

**Prerequisites:**

- Python script installed at: `/var/www/cs2-analysis/scripts/parse_demo.py`
- Python packages installed: `demoparser-py`, `numpy`, `scipy`, `requests`
- Application running on VPS at: `146.59.126.207`

---

## Quick Deployment (5 minutes)

### Step 1: Connect to VPS

```bash
ssh root@146.59.126.207
```

### Step 2: Navigate to application directory

```bash
cd /var/www/cs2-analysis
```

### Step 3: Pull the latest code

If using Git:

```bash
git pull origin main
```

Or upload the updated files via SFTP/SCP (specifically `server/routes/analyze.ts`)

### Step 4: Install dependencies (if any new ones added)

```bash
pnpm install
```

### Step 5: Build the application

```bash
pnpm build
```

### Step 6: Restart the application

```bash
pm2 restart cs2-analysis
pm2 logs cs2-analysis
```

**That's it!** The application will now use the Python script for demo analysis.

---

## What Changed

The backend now:

1. **Executes the Python script** at `/var/www/cs2-analysis/scripts/parse_demo.py` when a demo is uploaded
2. **Parses the JSON output** from the Python script for real demo analysis
3. **Falls back to JavaScript analyzer** if the Python script fails (for reliability)
4. **Saves match data** to the database with actual stats from the demo file

---

## Verification

### Check if Python script is accessible

```bash
ls -la /var/www/cs2-analysis/scripts/parse_demo.py
python3 /var/www/cs2-analysis/scripts/parse_demo.py --help
```

### Check application logs

```bash
pm2 logs cs2-analysis
```

Look for messages like:

- ✅ "Executing Python script: /var/www/cs2-analysis/scripts/parse_demo.py"
- ✅ "Python script analysis successful"

### Test demo upload

1. Upload a demo file via the web interface at `https://your-domain.com/dashboard`
2. Check the logs for Python script execution
3. Verify match data appears with real statistics (not random mock data)

---

## Troubleshooting

### Python script not found

```bash
# Verify file exists
ls -la /var/www/cs2-analysis/scripts/parse_demo.py

# Check permissions
chmod +x /var/www/cs2-analysis/scripts/parse_demo.py
```

### Python script fails but no error shown

```bash
# Test Python script manually
python3 /var/www/cs2-analysis/scripts/parse_demo.py /path/to/demo.dem

# Check Python packages
pip3 list | grep -E "demoparser|numpy|scipy|requests"
```

### App times out during analysis

The Python script has a 60-second timeout. Large demo files may exceed this. If needed, increase timeout in `server/routes/analyze.ts`:

Find this line:

```typescript
timeout: 60000, // 60 second timeout
```

And change to:

```typescript
timeout: 120000, // 120 second timeout
```

Then rebuild and restart:

```bash
cd /var/www/cs2-analysis
pnpm build
pm2 restart cs2-analysis
```

### "502 Bad Gateway" after deployment

```bash
# Check if Node.js is running
pm2 status

# Restart if needed
pm2 restart cs2-analysis

# Check logs
pm2 logs cs2-analysis --tail 50

# Restart Nginx
systemctl restart nginx
```

---

## Environment Variables (Optional)

If you need to customize the Python script path, add to `/var/www/cs2-analysis/.env.production`:

```
PYTHON_SCRIPT_PATH=/var/www/cs2-analysis/scripts/parse_demo.py
PYTHON_TIMEOUT=60000
```

Then update `server/routes/analyze.ts` to use these variables.

---

## Rollback (if needed)

If something goes wrong, revert to the previous version:

```bash
cd /var/www/cs2-analysis
git revert HEAD  # or git checkout <previous-commit>
pnpm build
pm2 restart cs2-analysis
```

---

## Performance Notes

- Python script execution: ~5-30 seconds per demo file (depending on file size)
- Fallback JavaScript analyzer: ~1-2 seconds (faster but less accurate)
- Recommendation: Keep Python script running for best results

---

## Next Steps

Once verified working:

1. Monitor logs for 24 hours to ensure stability
2. Test with various demo file sizes
3. Verify match data accuracy in the database
4. Set up regular backups (see DEPLOYMENT_GUIDE.md)

---

## Support

If issues persist:

1. Check full error logs: `pm2 logs cs2-analysis`
2. Verify Python script works standalone: `python3 /var/www/cs2-analysis/scripts/parse_demo.py <test-demo.dem>`
3. Check system resources: `htop`
4. Review Nginx error logs: `tail -f /var/log/nginx/error.log`

---

**Last Updated**: 2024
**Status**: Ready for production deployment
