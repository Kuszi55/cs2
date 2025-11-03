package main

import (
	"encoding/json"
	"fmt"
	"math"
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

type PlayerHistory struct {
	SteamID   uint64
	Name      string
	Team      common.Team
	Kills     []KillEvent
	Damages   []DamageEvent
}

type KillEvent struct {
	Tick     int
	Victim   string
	Weapon   string
	Headshot bool
}

type DamageEvent struct {
	Tick     int
	Attacker string
	Victim   string
	Damage   int
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
	playerHistory := make(map[uint64]*PlayerHistory)
	var players []*PlayerStats
	roundNum := 0

	// Event handlers
	parser.RegisterEventHandler(func(e events.Kill) {
		summary.TotalKills++

		if e.Killer != nil {
			killer := getOrCreatePlayer(e.Killer, playerMap, &players)
			killer.Kills++
			killer.Team = getTeamName(e.Killer.Team)

			// Track kill
			killerHist := getOrCreateHistory(e.Killer.SteamID64, playerHistory)
			victimName := "Unknown"
			if e.Victim != nil {
				victimName = e.Victim.Name
			}
			weaponName := "Unknown"
			if e.Weapon != nil {
				weaponName = e.Weapon.String()
			}
			killerHist.Kills = append(killerHist.Kills, KillEvent{
				Tick:     int(e.GameState().IngameTickCount()),
				Victim:   victimName,
				Weapon:   weaponName,
				Headshot: e.IsHeadshot,
			})

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

				// Track damage
				attackerHist := getOrCreateHistory(e.Attacker.SteamID64, playerHistory)
				attackerHist.Damages = append(attackerHist.Damages, DamageEvent{
					Tick:     int(e.GameState().IngameTickCount()),
					Attacker: e.Attacker.Name,
					Victim:   e.Player.Name,
					Damage:   totalDamage,
				})
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

	// Extract map name
	gs := parser.GameState()
	mapName := gs.MapName()
	if mapName != "" {
		summary.Map = cleanMapName(mapName)
	}

	// Get team scores
	ctTeam := gs.Team(common.TeamCounterTerrorist)
	tTeam := gs.Team(common.TeamTerrorist)

	if ctTeam != nil {
		summary.ScoreA = ctTeam.Score()
	}
	if tTeam != nil {
		summary.ScoreB = tTeam.Score()
	}

	// Calculate statistics
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

		killContribution := float64(p.Kills) * 0.5
		deathPenalty := float64(p.Deaths) * 0.3
		assistContribution := float64(p.Assists) * 0.15
		p.Rating = (killContribution + assistContribution - deathPenalty) / 5.0
		if p.Rating < 0.5 {
			p.Rating = 0.5
		}

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
	suspiciousMoments := detectSuspiciousMoments(playerHistory, playerMap)
	summary.SuspiciousMoments = suspiciousMoments

	// Sort players
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

	summary.Duration = int(parser.GameState().IngameTickCount())
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

	// Output
	json.NewEncoder(os.Stdout).Encode(summary)
}

// Detect suspicious moments
func detectSuspiciousMoments(history map[uint64]*PlayerHistory, playerMap map[uint64]*PlayerStats) []SuspiciousMoment {
	moments := make([]SuspiciousMoment, 0)

	for steamID, playerHist := range history {
		playerStats, ok := playerMap[steamID]
		if !ok {
			continue
		}

		// Detect high damage bursts
		if len(playerHist.Damages) > 0 {
			damages := playerHist.Damages
			for i := 0; i < len(damages)-1; i++ {
				burstDamage := 0
				burstStart := damages[i].Tick
				burstEnd := damages[i].Tick

				// Collect damage in 2-second window
				for j := i; j < len(damages) && damages[j].Tick-burstStart < 128; j++ {
					burstDamage += damages[j].Damage
					burstEnd = damages[j].Tick
				}

				if burstDamage > 150 && burstEnd-burstStart > 10 {
					confidence := math.Min(0.95, float64(burstDamage)/300.0)
					moment := SuspiciousMoment{
						PlayerName:        playerStats.Name,
						Team:              playerStats.Team,
						SuspicionType:     "damage_burst",
						Description:       fmt.Sprintf("High damage burst: %d damage in %d ticks", burstDamage, burstEnd-burstStart),
						Confidence:        confidence,
						TickStart:         burstStart,
						TickEnd:           burstEnd,
						EstimatedDuration: (burstEnd - burstStart) / 64,
					}
					moments = append(moments, moment)
					break
				}
			}
		}

		// Detect high headshot rate
		if len(playerHist.Kills) >= 3 {
			headshotCount := 0
			for _, kill := range playerHist.Kills {
				if kill.Headshot {
					headshotCount++
				}
			}

			hsRate := float64(headshotCount) / float64(len(playerHist.Kills))
			if hsRate > 0.5 && len(playerHist.Kills) >= 5 {
				confidence := math.Min(0.92, hsRate)
				moment := SuspiciousMoment{
					PlayerName:        playerStats.Name,
					Team:              playerStats.Team,
					SuspicionType:     "unusual_headshot_rate",
					Description:       fmt.Sprintf("Unusual headshot rate: %.1f%% (%d/%d)", hsRate*100, headshotCount, len(playerHist.Kills)),
					Confidence:        confidence,
					TickStart:         playerHist.Kills[0].Tick,
					TickEnd:           playerHist.Kills[len(playerHist.Kills)-1].Tick,
					EstimatedDuration: 5,
				}
				moments = append(moments, moment)
			}
		}

		// Detect extreme K/D ratio with many kills
		if playerStats.Kills > 15 && playerStats.Deaths < 5 {
			kdRatio := playerStats.KDRatio
			if kdRatio > 3.0 {
				confidence := math.Min(0.88, (kdRatio / 5.0))
				moment := SuspiciousMoment{
					PlayerName:        playerStats.Name,
					Team:              playerStats.Team,
					SuspicionType:     "extreme_kd_ratio",
					Description:       fmt.Sprintf("Extreme K/D ratio: %.2f (%d kills, %d deaths)", kdRatio, playerStats.Kills, playerStats.Deaths),
					Confidence:        confidence,
					TickStart:         0,
					TickEnd:           1000,
					EstimatedDuration: 5,
				}
				moments = append(moments, moment)
			}
		}

		// Detect accuracy anomalies
		if playerStats.Accuracy > 0.55 && playerStats.Kills > 10 {
			confidence := math.Min(0.85, (playerStats.Accuracy / 0.75))
			moment := SuspiciousMoment{
				PlayerName:        playerStats.Name,
				Team:              playerStats.Team,
				SuspicionType:     "unusual_accuracy",
				Description:       fmt.Sprintf("Unusually high accuracy: %.1f%% (from %d kills)", playerStats.Accuracy*100, playerStats.Kills),
				Confidence:        confidence,
				TickStart:         0,
				TickEnd:           1000,
				EstimatedDuration: 4,
			}
			moments = append(moments, moment)
		}
	}

	// Sort by confidence
	sort.Slice(moments, func(i, j int) bool {
		return moments[i].Confidence > moments[j].Confidence
	})

	// Return top 15 moments max
	if len(moments) > 15 {
		moments = moments[:15]
	}

	return moments
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

func getOrCreateHistory(steamID uint64, history map[uint64]*PlayerHistory) *PlayerHistory {
	if hist, ok := history[steamID]; ok {
		return hist
	}

	newHist := &PlayerHistory{
		SteamID: steamID,
		Kills:   make([]KillEvent, 0),
		Damages: make([]DamageEvent, 0),
	}
	history[steamID] = newHist
	return newHist
}

func getTeamName(team common.Team) string {
	if team == common.TeamCounterTerrorist {
		return "Counter-Terrorists"
	}
	if team == common.TeamTerrorist {
		return "Terrorists"
	}
	return "Unknown"
}

func cleanMapName(mapName string) string {
	mapName = strings.TrimSpace(mapName)
	mapName = strings.TrimPrefix(mapName, "de_")
	mapName = strings.TrimPrefix(mapName, "cs_")
	mapName = strings.TrimPrefix(mapName, "aim_")
	mapName = strings.TrimPrefix(mapName, "fy_")

	if len(mapName) > 0 {
		mapName = strings.ToUpper(string(mapName[0])) + strings.ToLower(mapName[1:])
	}

	return mapName
}
