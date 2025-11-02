package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"

	dem "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
)

type PlayerStats struct {
	Name       string   `json:"name"`
	SteamID    uint64   `json:"steamId"`
	Team       string   `json:"team"`
	Kills      int      `json:"kills"`
	Deaths     int      `json:"deaths"`
	Assists    int      `json:"assists"`
	Headshots  int      `json:"headshots"`
	Damage     int      `json:"damage"`
	DamageTaken int     `json:"damageTaken"`
	Utility    []string `json:"utility"`
	Plants     int      `json:"plants"`
	Defuses    int      `json:"defuses"`
	Weapons    map[string]int `json:"weapons"`
	Accuracy   float64  `json:"accuracy"`
	HSPercent  float64  `json:"hsPercent"`
	KDRatio    float64  `json:"kdRatio"`
	Rating     float64  `json:"rating"`
}

type DemoSummary struct {
	Success      bool          `json:"success"`
	Map          string        `json:"map"`
	GameMode     string        `json:"gameMode"`
	TeamA        string        `json:"teamAName"`
	TeamB        string        `json:"teamBName"`
	ScoreA       int           `json:"teamAScore"`
	ScoreB       int           `json:"teamBScore"`
	Duration     int           `json:"duration"`
	Rounds       int           `json:"rounds"`
	Players      []PlayerStats `json:"players"`
	TotalKills   int           `json:"totalKills"`
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println(`{"success": false, "error": "usage: cs2json <demo.dem>"}`)
		return
	}

	demoPath := os.Args[1]
	f, err := os.Open(demoPath)
	if err != nil {
		fmt.Printf(`{"success": false, "error": "cannot open demo: %v"}`, err)
		return
	}
	defer f.Close()

	parser := dem.NewParser(f)
	defer parser.Close()

	summary := DemoSummary{
		Success:   true,
		Map:       "Unknown",
		GameMode:  "5v5",
		TeamA:     "Counter-Terrorists",
		TeamB:     "Terrorists",
		Players:   make([]PlayerStats, 0),
	}

	// Track players by SteamID
	playerMap := make(map[uint64]*PlayerStats)
	var players []*PlayerStats
	roundNum := 0
	grenadeTypes := map[common.EquipmentType]string{
		common.EqDecoy:       "Decoy",
		common.EqFlash:       "Flash",
		common.EqHE:          "HE Grenade",
		common.EqIncendiary:  "Incendiary",
		common.EqMolotov:     "Molotov",
		common.EqSmoke:       "Smoke",
	}

	// Parse game header for map name
	header := parser.GameState().Map()
	if header != "" {
		summary.Map = header
	}

	// Register event handlers
	parser.RegisterEventHandler(func(e events.GamePhaseChanged) {
		if e.NewPhase == common.PhaseTeamSideSwitch {
			roundNum++
		}
	})

	parser.RegisterEventHandler(func(e events.PlayerConnect) {
		steamID := e.Player.SteamID64
		if _, exists := playerMap[steamID]; !exists {
			newPlayer := &PlayerStats{
				Name:    e.Player.Name,
				SteamID: steamID,
				Team:    e.Player.Team.String(),
				Weapons: make(map[string]int),
				Utility: make([]string, 0),
			}
			playerMap[steamID] = newPlayer
			players = append(players, newPlayer)
		}
	})

	parser.RegisterEventHandler(func(e events.Kill) {
		summary.TotalKills++

		if e.Killer != nil {
			killer := getOrCreatePlayer(e.Killer, playerMap, &players)
			killer.Kills++
			killer.Team = e.Killer.Team.String()

			if e.IsHeadshot {
				killer.Headshots++
			}

			if e.Weapon != nil {
				wepName := e.Weapon.String()
				killer.Weapons[wepName]++
			}

			if e.Assister != nil {
				assister := getOrCreatePlayer(e.Assister, playerMap, &players)
				assister.Assists++
			}
		}

		if e.Victim != nil {
			victim := getOrCreatePlayer(e.Victim, playerMap, &players)
			victim.Deaths++
			victim.Team = e.Victim.Team.String()
		}
	})

	parser.RegisterEventHandler(func(e events.PlayerHurt) {
		if e.Player != nil {
			player := getOrCreatePlayer(e.Player, playerMap, &players)
			player.DamageTaken += e.HealthDamage + e.ArmorDamage

			if e.Attacker != nil {
				attacker := getOrCreatePlayer(e.Attacker, playerMap, &players)
				attacker.Damage += e.HealthDamage + e.ArmorDamage
			}
		}
	})

	parser.RegisterEventHandler(func(e events.WeaponFire) {
		if e.Shooter != nil {
			player := getOrCreatePlayer(e.Shooter, playerMap, &players)
			if e.Weapon != nil {
				wepName := e.Weapon.String()
				// Track shots for accuracy calculation
				// This is approximate - would need additional tracking for true accuracy
			}
		}
	})

	parser.RegisterEventHandler(func(e events.GrenadeThrown) {
		if e.Thrower != nil {
			player := getOrCreatePlayer(e.Thrower, playerMap, &players)
			if grenadeType, ok := grenadeTypes[e.Grenade]; ok {
				// Check if utility already in list
				found := false
				for _, u := range player.Utility {
					if u == grenadeType {
						found = true
						break
					}
				}
				if !found {
					player.Utility = append(player.Utility, grenadeType)
				}
			}
		}
	})

	parser.RegisterEventHandler(func(e events.BombPlanted) {
		if e.Player != nil {
			player := getOrCreatePlayer(e.Player, playerMap, &players)
			player.Plants++
		}
	})

	parser.RegisterEventHandler(func(e events.BombDefused) {
		if e.Player != nil {
			player := getOrCreatePlayer(e.Player, playerMap, &players)
			player.Defuses++
		}
	})

	// Parse the demo
	if err = parser.ParseToEnd(); err != nil {
		fmt.Printf(`{"success": false, "error": "parse error: %v"}`, err)
		return
	}

	// Calculate statistics for each player
	for _, p := range players {
		if p.Deaths == 0 {
			p.KDRatio = float64(p.Kills)
		} else {
			p.KDRatio = float64(p.Kills) / float64(p.Deaths)
		}

		if p.Kills == 0 {
			p.HSPercent = 0
		} else {
			p.HSPercent = (float64(p.Headshots) / float64(p.Kills)) * 100
		}

		// Simple rating: kills + assists - deaths impact
		p.Rating = (float64(p.Kills) + float64(p.Assists)*0.3 - float64(p.Deaths)*0.7) / 5.0
		if p.Rating < 0.5 {
			p.Rating = 0.5
		}

		// Accuracy approximation based on damage and kills
		if p.Kills > 0 && p.Damage > 0 {
			p.Accuracy = float64(p.Kills) / float64(p.Damage) * 100
			if p.Accuracy > 100 {
				p.Accuracy = 100
			}
		}
	}

	// Sort players by kills
	sort.Slice(players, func(i, j int) bool {
		return players[i].Kills > players[j].Kills
	})

	// Convert to JSON format
	for _, p := range players {
		if p.Utility == nil {
			p.Utility = make([]string, 0)
		}
		if p.Weapons == nil {
			p.Weapons = make(map[string]int)
		}
		summary.Players = append(summary.Players, *p)
	}

	summary.Duration = int(parser.GameState().IngameTickCount())
	summary.Rounds = roundNum

	// Get team scores from game state
	gs := parser.GameState()
	if gs.TeamCounterTerrorist() != nil {
		summary.ScoreA = gs.TeamCounterTerrorist().Score()
	}
	if gs.TeamTerrorist() != nil {
		summary.ScoreB = gs.TeamTerrorist().Score()
	}

	// Output JSON
	json.NewEncoder(os.Stdout).Encode(summary)
}

func getOrCreatePlayer(p *common.Player, playerMap map[uint64]*PlayerStats, players *[]*PlayerStats) *PlayerStats {
	steamID := p.SteamID64
	if player, exists := playerMap[steamID]; exists {
		return player
	}

	newPlayer := &PlayerStats{
		Name:    p.Name,
		SteamID: steamID,
		Team:    p.Team.String(),
		Weapons: make(map[string]int),
		Utility: make([]string, 0),
	}
	playerMap[steamID] = newPlayer
	*players = append(*players, newPlayer)
	return newPlayer
}
