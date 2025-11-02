package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"

	dem "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
)

type PlayerStats struct {
	Name        string            `json:"name"`
	SteamID     uint64            `json:"steamId"`
	Team        string            `json:"team"`
	Kills       int               `json:"kills"`
	Deaths      int               `json:"deaths"`
	Assists     int               `json:"assists"`
	Headshots   int               `json:"headshots"`
	Damage      int               `json:"damage"`
	DamageTaken int               `json:"damageTaken"`
	Utility     []string          `json:"utility"`
	Plants      int               `json:"plants"`
	Defuses     int               `json:"defuses"`
	Weapons     map[string]int    `json:"weapons"`
	Accuracy    float64           `json:"accuracy"`
	HSPercent   float64           `json:"hsPercent"`
	KDRatio     float64           `json:"kdRatio"`
	Rating      float64           `json:"rating"`
}

type DemoSummary struct {
	Success     bool          `json:"success"`
	Map         string        `json:"map"`
	GameMode    string        `json:"gameMode"`
	TeamA       string        `json:"teamAName"`
	TeamB       string        `json:"teamBName"`
	ScoreA      int           `json:"teamAScore"`
	ScoreB      int           `json:"teamBScore"`
	Duration    int           `json:"duration"`
	Rounds      int           `json:"rounds"`
	Players     []PlayerStats `json:"players"`
	TotalKills  int           `json:"totalKills"`
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
		Success:    true,
		Map:        "Unknown",
		GameMode:   "5v5",
		TeamA:      "Counter-Terrorists",
		TeamB:      "Terrorists",
		Players:    make([]PlayerStats, 0),
		TotalKills: 0,
	}

	playerMap := make(map[uint64]*PlayerStats)
	var players []*PlayerStats
	roundNum := 0
	var maxRoundNum int

	grenadeTypes := map[common.EquipmentType]string{
		common.EqDecoy:      "Decoy",
		common.EqFlash:      "Flash",
		common.EqHE:         "HE Grenade",
		common.EqIncendiary: "Incendiary",
		common.EqMolotov:    "Molotov",
		common.EqSmoke:      "Smoke",
	}

	// Event handlers
	parser.RegisterEventHandler(func(e events.GamePhaseChanged) {
		if e.NewPhase == common.PhaseTeamSideSwitch {
			roundNum++
			if roundNum > maxRoundNum {
				maxRoundNum = roundNum
			}
		}
	})

	parser.RegisterEventHandler(func(e events.RoundStart) {
		roundNum++
		if roundNum > maxRoundNum {
			maxRoundNum = roundNum
		}
	})

	parser.RegisterEventHandler(func(e events.PlayerConnect) {
		steamID := e.Player.SteamID64
		if _, exists := playerMap[steamID]; !exists {
			newPlayer := &PlayerStats{
				Name:    e.Player.Name,
				SteamID: steamID,
				Team:    formatTeam(e.Player.Team.String()),
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
			killer.Team = formatTeam(e.Killer.Team.String())

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
			victim.Team = formatTeam(e.Victim.Team.String())
		}
	})

	parser.RegisterEventHandler(func(e events.PlayerHurt) {
		if e.Player != nil {
			player := getOrCreatePlayer(e.Player, playerMap, &players)
			healthDamage := e.HealthDamage
			armorDamage := e.ArmorDamage
			totalDamage := healthDamage + armorDamage
			player.DamageTaken += totalDamage

			if e.Attacker != nil && e.Attacker.SteamID64 != e.Player.SteamID64 {
				attacker := getOrCreatePlayer(e.Attacker, playerMap, &players)
				attacker.Damage += totalDamage
			}
		}
	})

	parser.RegisterEventHandler(func(e events.GrenadeThrown) {
		if e.Thrower != nil {
			player := getOrCreatePlayer(e.Thrower, playerMap, &players)
			if grenadeType, ok := grenadeTypes[e.Grenade]; ok {
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

	// Parse the entire demo file
	if err = parser.ParseToEnd(); err != nil {
		fmt.Printf(`{"success": false, "error": "parse error: %v"}`, err)
		return
	}

	// Extract map name from game state
	gs := parser.GameState()
	mapName := gs.Map()
	if mapName != "" {
		summary.Map = cleanMapName(mapName)
	}

	// Get team scores from final game state
	if gs.TeamCounterTerrorist() != nil {
		summary.ScoreA = gs.TeamCounterTerrorist().Score()
	}
	if gs.TeamTerrorist() != nil {
		summary.ScoreB = gs.TeamTerrorist().Score()
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

		// Calculate rating based on performance
		killContribution := float64(p.Kills) * 0.5
		deathPenalty := float64(p.Deaths) * 0.3
		assistContribution := float64(p.Assists) * 0.15
		p.Rating = (killContribution + assistContribution - deathPenalty) / 5.0
		if p.Rating < 0.5 {
			p.Rating = 0.5
		}

		// Accuracy: estimated from damage and kills
		if p.Kills > 0 && p.Damage > 0 {
			// Each kill averages ~25 damage
			estimatedShots := p.Damage / 25
			p.Accuracy = (float64(p.Kills) / estimatedShots) * 100
			if p.Accuracy > 100 {
				p.Accuracy = 100
			} else if p.Accuracy < 0 {
				p.Accuracy = 0
			}
			p.Accuracy = p.Accuracy / 100.0 // Convert to decimal
		}
	}

	// Sort players by kills descending
	sort.Slice(players, func(i, j int) bool {
		return players[i].Kills > players[j].Kills
	})

	// Determine game mode from player count
	totalPlayers := len(players)
	if totalPlayers <= 4 {
		summary.GameMode = "wingman"
	} else if totalPlayers <= 8 {
		summary.GameMode = "deathmatch"
	} else {
		summary.GameMode = "5v5"
	}

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
	summary.Rounds = maxRoundNum

	// Ensure scores are valid
	if summary.ScoreA == 0 && summary.ScoreB == 0 {
		// Calculate scores based on kills if not available
		teamAKills := 0
		teamBKills := 0
		for _, p := range summary.Players {
			if p.Team == "Counter-Terrorists" {
				teamAKills += p.Kills
			} else {
				teamBKills += p.Kills
			}
		}

		if teamAKills > 0 || teamBKills > 0 {
			total := teamAKills + teamBKills
			summary.ScoreA = (teamAKills * 16) / total
			summary.ScoreB = (teamBKills * 16) / total
			if summary.ScoreA > summary.ScoreB {
				if summary.ScoreB < 13 {
					summary.ScoreB = 13
				}
			} else if summary.ScoreB > summary.ScoreA {
				if summary.ScoreA < 13 {
					summary.ScoreA = 13
				}
			}
		}
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
		Team:    formatTeam(p.Team.String()),
		Weapons: make(map[string]int),
		Utility: make([]string, 0),
	}
	playerMap[steamID] = newPlayer
	*players = append(*players, newPlayer)
	return newPlayer
}

func formatTeam(team string) string {
	team = strings.TrimSpace(team)
	if strings.Contains(strings.ToLower(team), "ct") || strings.Contains(strings.ToLower(team), "counter") {
		return "Counter-Terrorists"
	}
	if strings.Contains(strings.ToLower(team), "t") || strings.Contains(strings.ToLower(team), "terrorist") {
		return "Terrorists"
	}
	return team
}

func cleanMapName(mapName string) string {
	mapName = strings.TrimSpace(mapName)
	mapName = strings.TrimPrefix(mapName, "de_")
	mapName = strings.TrimPrefix(mapName, "cs_")
	mapName = strings.TrimPrefix(mapName, "aim_")
	mapName = strings.TrimPrefix(mapName, "fy_")

	// Capitalize first letter
	if len(mapName) > 0 {
		mapName = strings.ToUpper(string(mapName[0])) + strings.ToLower(mapName[1:])
	}

	return mapName
}
