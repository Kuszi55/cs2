#!/usr/bin/env python3
import sys
import json
from demoparser import DemoParser

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file provided"}))
        sys.exit(1)

    filepath = sys.argv[1]
    try:
        parser = DemoParser(filepath)
        info = parser.parse_event_stream()

        players_stats = []
        for p in info['players']:
            player = {
                "name": p.get('name', ''),
                "steam_id": p.get('steamid', ''),
                "team": p.get('team', ''),
                "kills": p.get('kills', 0),
                "deaths": p.get('deaths', 0),
                "assists": p.get('assists', 0)
            }
            players_stats.append(player)

        rounds = info.get('rounds', [])
        score = {
            "team_a": sum(1 for r in rounds if r.get('winner') == "CT"),
            "team_b": sum(1 for r in rounds if r.get('winner') == "T")
        }

        result = {
            "success": True,
            "map": info.get('map', 'Unknown'),
            "players": players_stats,
            "score": score,
            "rounds": len(rounds),
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()