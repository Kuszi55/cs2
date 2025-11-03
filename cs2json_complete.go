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

type SuspiciousMoment struct {
	PlayerName        string  `json:"playerName"`
	Team              string  `json:"team"`
	SuspicionType     string  `json:"suspicionType"`
	Description       string  `json:"description"`
	Confidence        float64 `json:"confidence"`
	TickStart         int     `json:"tick_start"`
	TickEnd           int     `json:"tick_end"`
	EstimatedDuration int     `json:"estimatedDuration"`
}

type DemoSummary struct {
	Success           bool               `json:"success"`
	Map               string             `json:"map"`
	GameMode          string             `json:"gameMode"`
	TeamA             string             `json:"teamAName"`
	TeamB             string             `json:"teamBName"`
	ScoreA            int                `json:"teamAScore"`
	ScoreB            int                `json:"teamBScore"`
	Duration          int                `json:"duration"`
	Rounds            int                `json:"rounds"`
	Players           []PlayerStats      `json:"players"`
	TotalKills        int                `json:"totalKills"`
	SuspiciousMoments []SuspiciousMoment `json:"suspiciousMoments"`
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
		Success:           true,
		Map:               "Unknown",
		GameMode:          "5v5",
		TeamA:             "Counter-Terrorists",
		TeamB:             "Terrorists",
		Players:           make([]PlayerStats, 0),
		TotalKills:        0,
		SuspiciousMoments: make([]SuspiciousMoment, 0),
	}

	playerMap := make(map[uint64]*PlayerStats)
	var players []*PlayerStats
	roundNum := 0

	// Track kills and damages for suspicious moment detection
	playerKills := make(map[uint64]int)
	playerHS := make(map[uint64]int)
	playerDamage := make(map[uint64]int)

	// Event handlers
	parser.RegisterEventHandler(func(e events.Kill) {
		summary.TotalKills++

		if e.Killer != nil {
			killer := getOrCreatePlayer(e.Killer, playerMap, &players)
			killer.Kills++
			killer.Team = getTeamName(e.Killer.Team)
			playerKills[e.Killer.SteamID64]++

			if e.IsHeadshot {
				killer.Headshots++
				playerHS[e.Killer.SteamID64]++
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
			victim.Team = getTeamName(e.Victim.Team)
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
				playerDamage[e.Attacker.SteamID64] += totalDamage
			}
		}
	})

	parser.RegisterEventHandler(func(e events.RoundStart) {
		roundNum++
	})

	// Parse the entire demo file
	if err = parser.ParseToEnd(); err != nil {
		fmt.Printf(`{"success": false, "error": "parse error: %v"}`, err)
		return
	}

	// Extract map name from demo file
	gs := parser.GameState()
	mapName := gs.Map()
	if mapName != "" {
		summary.Map = cleanMapName(mapName)
	}

	// Get team scores
	ctTeam := gs.Team(1) // 1 = Counter-Terrorist
	tTeam := gs.Team(2)  // 2 = Terrorist

	if ctTeam != nil {
		summary.ScoreA = ctTeam.Score()
	}
	if tTeam != nil {
		summary.ScoreB = tTeam.Score()
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

		// Calculate rating
		killContribution := float64(p.Kills) * 0.5
		deathPenalty := float64(p.Deaths) * 0.3
		assistContribution := float64(p.Assists) * 0.15
		p.Rating = (killContribution + assistContribution - deathPenalty) / 5.0
		if p.Rating < 0.5 {
			p.Rating = 0.5
		}

		// Calculate accuracy
		if p.Kills > 0 && p.Damage > 0 {
			estimatedShots := p.Damage / 25
			p.Accuracy = (float64(p.Kills) / float64(estimatedShots)) * 100
			if p.Accuracy > 100 {
				p.Accuracy = 100
			} else if p.Accuracy < 0 {
				p.Accuracy = 0
			}
			p.Accuracy = p.Accuracy / 100.0
		}
	}

	// Detect suspicious moments
	detectSuspiciousMoments(&summary, players, playerKills, playerHS)

	// Sort players by kills
	sort.Slice(players, func(i, j int) bool {
		return players[i].Kills > players[j].Kills
	})

	// Determine game mode
	totalPlayers := len(players)
	if totalPlayers <= 4 {
		summary.GameMode = "wingman"
	} else if totalPlayers <= 8 {
		summary.GameMode = "deathmatch"
	} else {
		summary.GameMode = "5v5"
	}

	// Add players to summary
	for _, p := range players {
		if p.Utility == nil {
			p.Utility = make([]string, 0)
		}
		if p.Weapons == nil {
			p.Weapons = make(map[string]int)
		}
		summary.Players = append(summary.Players, *p)
	}

	summary.Duration = int(gs.IngameTickCount())
	summary.Rounds = roundNum

	// Ensure valid scores
	if summary.ScoreA == 0 && summary.ScoreB == 0 {
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
		}
	}

	// Output JSON
	json.NewEncoder(os.Stdout).Encode(summary)
}

func detectSuspiciousMoments(summary *DemoSummary, players []*PlayerStats, playerKills map[uint64]int, playerHS map[uint64]int) {
	for _, p := range players {
		// High headshot rate
		if p.Kills >= 5 && p.HSPercent > 50 {
			moment := SuspiciousMoment{
				PlayerName:        p.Name,
				Team:              p.Team,
				SuspicionType:     "unusual_headshot_rate",
				Description:       fmt.Sprintf("Unusual HS rate: %.1f%% (%d/%d)", p.HSPercent, p.Headshots, p.Kills),
				Confidence:        0.85,
				TickStart:         0,
				TickEnd:           1000,
				EstimatedDuration: 5,
			}
			summary.SuspiciousMoments = append(summary.SuspiciousMoments, moment)
		}

		// High accuracy
		if p.Kills > 10 && p.Accuracy > 0.55 {
			moment := SuspiciousMoment{
				PlayerName:        p.Name,
				Team:              p.Team,
				SuspicionType:     "unusual_accuracy",
				Description:       fmt.Sprintf("High accuracy: %.1f%%", p.Accuracy*100),
				Confidence:        0.80,
				TickStart:         0,
				TickEnd:           1000,
				EstimatedDuration: 4,
			}
			summary.SuspiciousMoments = append(summary.SuspiciousMoments, moment)
		}

		// Extreme K/D
		if p.Kills > 15 && p.KDRatio > 3.0 {
			moment := SuspiciousMoment{
				PlayerName:        p.Name,
				Team:              p.Team,
				SuspicionType:     "extreme_kd_ratio",
				Description:       fmt.Sprintf("Extreme K/D: %.2f", p.KDRatio),
				Confidence:        0.75,
				TickStart:         0,
				TickEnd:           1000,
				EstimatedDuration: 5,
			}
			summary.SuspiciousMoments = append(summary.SuspiciousMoments, moment)
		}
	}
}

func getOrCreatePlayer(p *common.Player, playerMap map[uint64]*PlayerStats, players *[]*PlayerStats) *PlayerStats {
	if p == nil {
		return nil
	}

	steamID := p.SteamID64
	if player, exists := playerMap[steamID]; exists {
		return player
	}

	newPlayer := &PlayerStats{
		Name:    p.Name,
		SteamID: steamID,
		Team:    getTeamName(p.Team),
		Weapons: make(map[string]int),
		Utility: make([]string, 0),
	}
	playerMap[steamID] = newPlayer
	*players = append(*players, newPlayer)
	return newPlayer
}

func getTeamName(team common.Team) string {
	// Team 1 = CT, Team 2 = T
	if team == 1 {
		return "Counter-Terrorists"
	}
	if team == 2 {
		return "Terrorists"
	}
	return "Unknown"
}

func cleanMapName(mapName string) string {
	mapName = strings.TrimSpace(mapName)
	mapName = strings.TrimPrefix(mapName, "de_")
	mapName = strings.TrimPrefix(mapName, "cs_")

	if len(mapName) > 0 {
		mapName = strings.ToUpper(string(mapName[0])) + strings.ToLower(mapName[1:])
	}

	return mapName
}
