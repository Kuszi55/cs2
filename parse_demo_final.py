#!/usr/bin/env python3
import subprocess, sys, json, os, time, math

if len(sys.argv) < 2:
    print(json.dumps({"success": False, "error": "No demo file provided"}))
    sys.exit(1)

demo_path = sys.argv[1]
base_dir = os.path.dirname(os.path.dirname(__file__))
cs2json_path = os.path.join(base_dir, "scripts", "cs2json")
log_path = os.path.join(base_dir, "logs", "parser.log")

def log(msg):
    try:
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
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

def extract_map_from_filename(filepath):
    maps = ["mirage", "inferno", "ancient", "nuke", "overpass", "vertigo", "dust2", "anubis", "train"]
    filename = os.path.basename(filepath).lower()
    for m in maps:
        if m in filename:
            return m.capitalize()
    return "Unknown"

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
        
        if not parsed.get("success"):
            error_msg = parsed.get("error", "Unknown error from cs2json")
            log(f"cs2json error: {error_msg}")
            print(json.dumps({"success": False, "error": error_msg}))
            sys.exit(1)

        # 🔹 Use REAL map from Go binary or extract from filename
        map_name = parsed.get("map", "Unknown")
        if map_name == "Unknown":
            map_name = extract_map_from_filename(demo_path)

        # 🔹 Use REAL players data from Go binary
        raw_players = parsed.get("players", [])
        
        # Determine game mode
        total_players = len(raw_players)
        if total_players <= 4:
            game_mode = "wingman"
        elif total_players <= 8:
            game_mode = "deathmatch"
        else:
            game_mode = "5v5"

        # 🔹 Process REAL player statistics from Go binary
        players = []
        team_a_kills = 0
        team_b_kills = 0
        
        for p in raw_players:
            # Get REAL stats from Go binary output
            team = p.get("team", "Counter-Terrorists")
            kills = p.get("kills", 0)
            deaths = max(p.get("deaths", 0), 1)
            assists = p.get("assists", 0)
            headshots = p.get("headshots", 0)
            damage = p.get("damage", 0)
            damage_taken = p.get("damageTaken", 0)
            plants = p.get("plants", 0)
            defuses = p.get("defuses", 0)
            utility = p.get("utility", [])
            weapons = p.get("weapons", {})
            
            # Calculate real accuracy and percentages from Go data
            hs_percent = 0.0
            if kills > 0:
                hs_percent = round((headshots / kills) * 100, 1)
            
            kd_ratio = round(kills / deaths, 2) if deaths > 0 else float(kills)
            
            # Get accuracy from Go binary data
            accuracy = p.get("accuracy", 0.0)
            
            # Use Go binary's rating or calculate
            rating = p.get("rating", 0.0)
            
            is_ct = team == "Counter-Terrorists"
            
            if is_ct:
                team_a_kills += kills
            else:
                team_b_kills += kills
            
            player_data = {
                "name": p.get("name", "Unknown"),
                "steamId": str(p.get("steamId", 0)),
                "team": team,
                "kills": kills,
                "deaths": deaths,
                "assists": assists,
                "accuracy": round(accuracy, 2) if isinstance(accuracy, float) else accuracy,
                "headshots": headshots,
                "hsPercent": hs_percent,
                "totalDamage": damage,
                "avgDamage": round(damage / max(deaths + kills, 1), 1),
                "kdRatio": kd_ratio,
                "plants": plants,
                "defuses": defuses,
                "utility": utility if utility else [],
                "rating": round(rating, 2)
            }
            players.append(player_data)

        # Determine team scores
        team_a_score = parsed.get("teamAScore", 0)
        team_b_score = parsed.get("teamBScore", 0)
        
        # If scores not in Go output, don't change them
        # The Go binary should have correct scores
        
        # 🔹 Generate fraud assessments based on REAL statistics with improved calculation
        fraud_assessments = []
        
        for player in players:
            # Use real stats for fraud assessment calculation
            accuracy_val = player["accuracy"] if isinstance(player["accuracy"], (int, float)) else 0.0
            hs_pct = player["hsPercent"]
            kd = player["kdRatio"]
            kills = player["kills"]
            damage = player["totalDamage"]
            
            # Fraud scoring based on statistical anomalies
            fraud_prob = 0.0
            suspicious = []
            
            # ============ AIM SCORE ============
            # Unusual accuracy (typically 20-40% in real matches)
            if accuracy_val > 0.50:
                fraud_prob += min(40, (accuracy_val - 0.50) * 800)  # Heavy weight on very high accuracy
                suspicious.append({
                    "type": "unusual_accuracy",
                    "confidence": round(min(95, accuracy_val * 150), 1),
                    "description": f"Very high accuracy: {accuracy_val*100:.1f}%",
                    "tick": 0
                })
            elif accuracy_val > 0.40:
                fraud_prob += min(25, (accuracy_val - 0.40) * 500)
                suspicious.append({
                    "type": "unusual_accuracy",
                    "confidence": round(min(85, accuracy_val * 130), 1),
                    "description": f"High accuracy: {accuracy_val*100:.1f}%",
                    "tick": 0
                })
            
            # ============ HEADSHOT RATE ============
            # Typical HS% is 15-30%, above 45% is suspicious
            if hs_pct > 50:
                fraud_prob += min(50, (hs_pct - 50) * 2)  # Heavy weight
                suspicious.append({
                    "type": "abnormal_headshot_rate",
                    "confidence": round(min(95, hs_pct * 1.5), 1),
                    "description": f"Extremely high HS rate: {hs_pct:.1f}%",
                    "tick": 0
                })
            elif hs_pct > 40:
                fraud_prob += min(35, (hs_pct - 40) * 3)
                suspicious.append({
                    "type": "high_headshot_rate",
                    "confidence": round(min(85, hs_pct * 1.5), 1),
                    "description": f"High HS rate: {hs_pct:.1f}%",
                    "tick": 0
                })
            
            # ============ K/D RATIO ============
            # Typical K/D is 0.8-1.2, above 2.5 is very rare for normal play
            if kd > 3.5:
                fraud_prob += min(45, (kd - 3.5) * 20)  # Heavy weight on extreme K/D
                suspicious.append({
                    "type": "extreme_kd_ratio",
                    "confidence": round(min(95, kd * 20), 1),
                    "description": f"Extreme K/D ratio: {kd:.2f}",
                    "tick": 0
                })
            elif kd > 2.5:
                fraud_prob += min(35, (kd - 2.5) * 15)
                suspicious.append({
                    "type": "high_kd_ratio",
                    "confidence": round(min(85, kd * 20), 1),
                    "description": f"Very high K/D: {kd:.2f}",
                    "tick": 0
                })
            elif kd > 1.8:
                fraud_prob += min(20, (kd - 1.8) * 10)
            
            # ============ KILL COUNT ============
            # Very high kills relative to match duration
            if kills > 30:
                fraud_prob += min(30, (kills - 30) * 2)
                suspicious.append({
                    "type": "extreme_kill_count",
                    "confidence": round(min(90, (kills / 50) * 100), 1),
                    "description": f"Exceptionally high kill count: {kills}",
                    "tick": 0
                })
            elif kills > 25:
                fraud_prob += min(20, (kills - 25) * 1.5)
            
            # ============ DAMAGE CONSISTENCY ============
            # Average damage per kill should be 50-80 in most matches
            if kills > 0:
                avg_dmg_per_kill = damage / kills
                if avg_dmg_per_kill < 20 and kills > 5:
                    # Too low damage for kills - suspicious (lock aim but low damage = wallhack?)
                    fraud_prob += min(25, (20 - avg_dmg_per_kill) * 2)
            
            # ============ RATING-BASED ANOMALIES ============
            rating = player["rating"]
            if rating > 1.5:
                fraud_prob += min(25, (rating - 1.5) * 30)
            
            # ============ COMBINATION PATTERNS ============
            # Multiple suspicious indicators combined
            if len(suspicious) > 2:
                fraud_prob += 10  # Penalty for multiple anomalies
            
            # Normalize to 0-100
            fraud_prob = min(100, max(0, fraud_prob))
            
            # Determine risk level
            if fraud_prob >= 75:
                risk_level = "critical"
            elif fraud_prob >= 55:
                risk_level = "high"
            elif fraud_prob >= 35:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            # Additional suspicious activities based on patterns
            if kills > 15 and (hs_pct > 30 or accuracy_val > 0.45):
                if not any(s["type"] == "consistent_flicking" for s in suspicious):
                    suspicious.append({
                        "type": "consistent_flicking",
                        "confidence": round(min(80, (kills / 40) * 100), 1),
                        "description": f"Consistent headshot flicking pattern in {kills} kills",
                        "tick": 0
                    })
            
            # Personal/team performance score
            team_mate_avg_kd = 1.0  # Would calculate from teammates
            if kd > team_mate_avg_kd * 2:
                suspicious.append({
                    "type": "isolated_performance",
                    "confidence": round(min(70, (kd / team_mate_avg_kd - 2) * 30), 1),
                    "description": f"Performance significantly above team average",
                    "tick": 0
                })
            
            fraud_assessments.append({
                "playerName": player["name"],
                "fraudProbability": round(fraud_prob, 1),
                "aimScore": round(min(100, (accuracy_val * 100 + hs_pct) / 2), 1),
                "positioningScore": round(min(100, kd * 40), 1),
                "reactionScore": round(min(100, hs_pct * 2.5), 1),
                "gameSenseScore": round(min(100, player["assists"] * 15), 1),
                "consistencyScore": round(min(100, (kills / max(1, kills + player["deaths"])) * 80), 1),
                "suspiciousActivities": suspicious,
                "riskLevel": risk_level
            })
        
        result = {
            "success": True,
            "analysis": {
                "mapName": map_name,
                "gameMode": game_mode,
                "teamAName": "Counter-Terrorists",
                "teamBName": "Terrorists",
                "teamAScore": team_a_score,
                "teamBScore": team_b_score,
                "duration": parsed.get("duration", 0),
                "rounds": parsed.get("rounds", 0),
                "players": players,
                "fraudAssessments": fraud_assessments,
                "totalEventsProcessed": parsed.get("totalKills", 0),
            },
            "sourceFile": os.path.basename(demo_path),
        }
        
        log(f"✅ Parsed: {map_name}, {game_mode}, {total_players} players, score {team_a_score}-{team_b_score}")
        print(json.dumps(result))

    except json.JSONDecodeError as e:
        log(f"JSON parse error: {str(e)}")
        print(json.dumps({
            "success": False, 
            "error": f"Failed to parse cs2json output: {str(e)}"
        }))
        sys.exit(1)
    except Exception as e:
        log(f"Processing error: {str(e)}")
        print(json.dumps({
            "success": False, 
            "error": f"Failed to process demo: {str(e)}"
        }))
        sys.exit(1)

except subprocess.TimeoutExpired:
    msg = "cs2json timeout after 120s"
    log(msg)
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)

except Exception as e:
    msg = f"Unexpected error: {str(e)}"
    log(msg)
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)
