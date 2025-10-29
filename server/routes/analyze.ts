#!/usr/bin/env python3
import subprocess
import sys
import json
import os
import time

# Ścieżki
BASE = os.path.dirname(os.path.dirname(__file__))
CS2JSON = os.path.join(BASE, "scripts", "cs2json")
LOGDIR = os.path.join(BASE, "logs")
LOGFILE = os.path.join(LOGDIR, "parser.log")
os.makedirs(LOGDIR, exist_ok=True)

# Funkcja logowania
def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    try:
        with open(LOGFILE, "a") as f:
            f.write(f"{ts} - {msg}\n")
    except:
        pass

# Sprawdzenie argumentu
if len(sys.argv) < 2:
    print(json.dumps({"success": False, "error": "Usage: parse_demo.py <path_to_demo>"}))
    sys.exit(1)

demo_path = sys.argv[1]

# Sprawdzenie pliku cs2json
if not os.path.exists(CS2JSON):
    msg = f"cs2json binary not found at {CS2JSON}"
    log(msg)
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)

# Sprawdzenie pliku demo
if not os.path.exists(demo_path):
    msg = f"demo not found: {demo_path}"
    log(msg)
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)

try:
    # Wywołanie cs2json
    proc = subprocess.run([CS2JSON, demo_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=180)
    
    # Logowanie stdout/stderr
    log(f"RUN {CS2JSON} {demo_path} -> rc={proc.returncode}")
    log("STDOUT: " + (proc.stdout[:5000] + "...(truncated)" if len(proc.stdout) > 5000 else proc.stdout))
    log("STDERR: " + (proc.stderr[:5000] + "...(truncated)" if len(proc.stderr) > 5000 else proc.stderr))

    if proc.returncode != 0:
        errtxt = proc.stderr.strip() or "cs2json failed with no output"
        log(f"cs2json failed: {errtxt}")
        print(json.dumps({"success": False, "error": errtxt}))
        sys.exit(1)

    # Parsowanie JSON
    try:
        parsed = json.loads(proc.stdout)
        # zapewniamy obecność mapy i gameMode
        if "map" not in parsed:
            parsed["map"] = "Unknown"
        if "gameMode" not in parsed:
            parsed["gameMode"] = "Unknown"
        # zwracamy w polu analysis, zgodnie z frontem
        print(json.dumps({"success": True, "analysis": parsed}))
    except Exception:
        print(json.dumps({
            "success": True,
            "analysis": {"raw": proc.stdout.strip(), "map": "Unknown", "gameMode": "Unknown"}
        }))

except subprocess.TimeoutExpired:
    log(f"Timeout for {demo_path}")
    print(json.dumps({"success": False, "error": "cs2json timeout"}))
    sys.exit(1)
except Exception as e:
    log(f"Exception running cs2json: {e}")
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1)
