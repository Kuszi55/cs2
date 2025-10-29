#!/usr/bin/env python3
import subprocess, sys, json, os, time

if len(sys.argv) < 2:
    print(json.dumps({"success": False, "error": "No demo file provided"}))
    sys.exit(1)

demo_path = sys.argv[1]
base_dir = os.path.dirname(os.path.dirname(__file__))
cs2json_path = os.path.join(base_dir, "scripts", "cs2json")
log_path = os.path.join(base_dir, "logs", "parser.log")

def log(msg):
    try:
        with open(log_path, "a") as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {msg}\n")
    except:
        pass

if not os.path.exists(cs2json_path):
    msg = f"cs2json binary not found at {cs2json_path}"
    log(msg)
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)

if not os.path.exists(demo_path):
    msg = f"demo not found: {demo_path}"
    log(msg)
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)

try:
    proc = subprocess.run(
        [cs2json_path, demo_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=120
    )

    if proc.returncode != 0:
        log(f"cs2json failed: {proc.stderr.strip()}")
        print(json.dumps({"success": False, "error": proc.stderr.strip()}))
        sys.exit(1)

    out = proc.stdout.strip()

    try:
        parsed = json.loads(out)
        
        # ✅ KLUCZOWA ZMIANA: Zawsze zwracaj strukturę z 'analysis'
        result = {
            "success": True,
            "analysis": {
                "mapName": parsed.get("map", "Unknown"),
                "gameMode": parsed.get("gameMode", "5v5"),
                "teamAName": "Team A",
                "teamBName": "Team B", 
                "teamAScore": parsed.get("teamAScore", 0),
                "teamBScore": parsed.get("teamBScore", 0),
                "duration": 0,
                "players": parsed.get("players", []),
                "fraudAssessments": [],
                "totalEventsProcessed": 0
            },
            "sourceFile": os.path.basename(demo_path),
        }
        
        # ✅ Sprawdź czy wymagane pola istnieją
        if not result["analysis"]["mapName"]:
            result["analysis"]["mapName"] = "Unknown"
        if not result["analysis"]["gameMode"]:
            result["analysis"]["gameMode"] = "5v5"
            
        print(json.dumps(result))

    except Exception as e:
        log(f"JSON parse error: {str(e)}")
        print(json.dumps({
            "success": False, 
            "error": f"Failed to parse cs2json output: {str(e)}"
        }))
        sys.exit(1)

except subprocess.TimeoutExpired:
    msg = "cs2json timeout after 120s"
    log(msg)
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)

except Exception as e:
    msg = f"unexpected error: {str(e)}"
    log(msg)
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)
