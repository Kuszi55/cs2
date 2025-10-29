#!/usr/bin/env python3
import subprocess, sys, json, os, time

if len(sys.argv) < 2:
    print(json.dumps({"success": False, "error": "No demo file provided"})); sys.exit(1)

demo_path = sys.argv[1]
cs2json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "cs2json")
log_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs", "parser.log")

def log(msg):
    try:
        with open(log_path, "a") as f: f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {msg}\n")
    except: pass

if not os.path.exists(cs2json_path):
    msg = f"cs2json binary not found at {cs2json_path}"; log(msg); print(json.dumps({"success": False, "error": msg})); sys.exit(1)
if not os.path.exists(demo_path):
    msg = f"demo not found: {demo_path}"; log(msg); print(json.dumps({"success": False, "error": msg})); sys.exit(1)

try:
    proc = subprocess.run([cs2json_path, demo_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
    if proc.returncode != 0:
        log(f"cs2json failed: {proc.stderr.strip()}"); print(json.dumps({"success": False, "error": proc.stderr.strip()})); sys.exit(1)
    out = proc.stdout.strip()
    try:
        parsed = json.loads(out); print(json.dumps(parsed))
    except Exception:
        print(json.dumps({"success": True, "raw": out}))
except subpr
