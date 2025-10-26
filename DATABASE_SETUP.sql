-- CS2 Demo Analysis Database Schema
-- Execute all these queries in your MySQL database (s7446_ZENIT)

-- ============================================
-- MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  demo_file_name VARCHAR(255) NOT NULL,
  demo_file_hash VARCHAR(64) UNIQUE,
  game_mode ENUM('5v5', 'wingman', 'deathmatch', 'community', 'other') NOT NULL,
  map_name VARCHAR(100) NOT NULL,
  match_date DATETIME NOT NULL,
  duration_seconds INT,
  team_a_name VARCHAR(100) DEFAULT 'Team A',
  team_b_name VARCHAR(100) DEFAULT 'Team B',
  team_a_score INT DEFAULT 0,
  team_b_score INT DEFAULT 0,
  winning_team VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  INDEX idx_map (map_name),
  INDEX idx_game_mode (game_mode),
  INDEX idx_date (match_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PLAYERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  steam_id VARCHAR(50),
  player_name VARCHAR(100) NOT NULL,
  team VARCHAR(100) NOT NULL,
  is_bot BOOLEAN DEFAULT FALSE,
  player_index INT,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_match_player (match_id, steam_id),
  INDEX idx_player_name (player_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PLAYER STATISTICS TABLE (per match)
-- ============================================
CREATE TABLE IF NOT EXISTS player_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  match_id INT NOT NULL,
  
  -- Basic Stats
  kills INT DEFAULT 0,
  deaths INT DEFAULT 0,
  assists INT DEFAULT 0,
  kd_ratio DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN deaths > 0 THEN kills / deaths ELSE kills END
  ) STORED,
  
  -- Shooting Stats
  total_shots INT DEFAULT 0,
  shots_hit INT DEFAULT 0,
  accuracy_percent DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_shots > 0 THEN (shots_hit / total_shots) * 100 ELSE 0 END
  ) STORED,
  headshots INT DEFAULT 0,
  headshot_percent DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN kills > 0 THEN (headshots / kills) * 100 ELSE 0 END
  ) STORED,
  chest_shots INT DEFAULT 0,
  leg_shots INT DEFAULT 0,
  
  -- Utility Stats
  damage_dealt INT DEFAULT 0,
  damage_taken INT DEFAULT 0,
  utility_damage INT DEFAULT 0,
  enemies_killed_with_utility INT DEFAULT 0,
  
  -- Economy
  total_money_spent INT DEFAULT 0,
  total_money_earned INT DEFAULT 0,
  average_buy_value INT DEFAULT 0,
  
  -- Objective
  bombs_planted INT DEFAULT 0,
  bombs_defused INT DEFAULT 0,
  bomb_plants_assisted INT DEFAULT 0,
  clutches_won INT DEFAULT 0,
  
  -- Positioning & Movement
  distance_traveled DECIMAL(10, 2) DEFAULT 0,
  average_velocity DECIMAL(8, 2) DEFAULT 0,
  
  -- Rating System
  rating_1 DECIMAL(5, 2) DEFAULT 0,
  rating_2 DECIMAL(5, 2) DEFAULT 0,
  impact_rating DECIMAL(5, 2) DEFAULT 0,
  
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_match_stats (match_id),
  INDEX idx_player_stats (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SUSPICIOUS ACTIVITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  match_id INT NOT NULL,
  
  -- Detection Type
  detection_type ENUM(
    'unusual_accuracy',
    'prefire_pattern',
    'wall_tracking',
    'abnormal_reaction_time',
    'headshot_spam',
    'impossible_aim_angle',
    'crosshair_placement_anomaly',
    'quick_flick_spam',
    'consistent_lock_on_head',
    'wallbang_consistency',
    'radar_reading_pattern',
    'unusual_positioning'
  ) NOT NULL,
  
  -- Severity & Confidence
  confidence_percent DECIMAL(5, 2) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  
  -- Details
  description TEXT,
  tick_number INT,
  timestamp_in_demo INT COMMENT 'Seconds from start of demo',
  
  -- Detection Values
  accuracy_anomaly DECIMAL(5, 2),
  headshot_rate_anomaly DECIMAL(5, 2),
  reaction_time_ms INT,
  aim_displacement_degrees DECIMAL(6, 2),
  snapshot_distance_pixels INT,
  
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_player_suspicious (player_id, confidence_percent),
  INDEX idx_match_suspicious (match_id),
  INDEX idx_detection_type (detection_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FRAUD PROBABILITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fraud_assessment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  match_id INT NOT NULL,
  
  -- Overall Score (0-100)
  fraud_probability_percent DECIMAL(5, 2) NOT NULL,
  
  -- Component Scores
  aim_score DECIMAL(5, 2) DEFAULT 0,
  positioning_score DECIMAL(5, 2) DEFAULT 0,
  reaction_score DECIMAL(5, 2) DEFAULT 0,
  game_sense_score DECIMAL(5, 2) DEFAULT 0,
  consistency_score DECIMAL(5, 2) DEFAULT 0,
  
  -- Risk Level
  risk_level ENUM('low', 'medium', 'high', 'critical') GENERATED ALWAYS AS (
    CASE
      WHEN fraud_probability_percent >= 80 THEN 'critical'
      WHEN fraud_probability_percent >= 60 THEN 'high'
      WHEN fraud_probability_percent >= 30 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  
  -- Analysis Details
  suspicious_activity_count INT DEFAULT 0,
  unusual_patterns_count INT DEFAULT 0,
  
  -- Assessment Info
  assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assessment_notes TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INT,
  
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assessment (player_id, match_id),
  INDEX idx_fraud_probability (fraud_probability_percent),
  INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GAME EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS game_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  player_id INT,
  
  event_type ENUM(
    'kill',
    'death',
    'assist',
    'weapon_fire',
    'damage',
    'bomb_plant',
    'bomb_defuse',
    'round_start',
    'round_end',
    'grenade_throw',
    'position_update',
    'aim_point',
    'view_angle',
    'player_jump',
    'weapon_switch'
  ) NOT NULL,
  
  tick_number INT,
  round_number INT,
  timestamp_ms INT,
  
  -- Event-specific data
  victim_id INT,
  weapon VARCHAR(50),
  damage_amount INT,
  was_headshot BOOLEAN DEFAULT FALSE,
  was_wallbang BOOLEAN DEFAULT FALSE,
  
  -- Position Data
  killer_x DECIMAL(10, 2),
  killer_y DECIMAL(10, 2),
  killer_z DECIMAL(10, 2),
  victim_x DECIMAL(10, 2),
  victim_y DECIMAL(10, 2),
  victim_z DECIMAL(10, 2),
  distance_meters DECIMAL(8, 2),
  
  -- Aim Data
  view_angle_x DECIMAL(8, 2),
  view_angle_y DECIMAL(8, 2),
  aim_punch_x DECIMAL(8, 2),
  aim_punch_y DECIMAL(8, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (victim_id) REFERENCES players(id) ON DELETE SET NULL,
  INDEX idx_match_events (match_id),
  INDEX idx_player_events (player_id),
  INDEX idx_event_type (event_type),
  INDEX idx_round_tick (round_number, tick_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CLIPS TABLE (for suspicious moments)
-- ============================================
CREATE TABLE IF NOT EXISTS clips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  player_id INT,
  
  clip_type ENUM(
    'prefire',
    'wall_tracking',
    'suspicious_kill',
    'reaction_anomaly',
    'positioning_anomaly',
    'wallbang_spam'
  ) NOT NULL,
  
  start_tick INT NOT NULL,
  end_tick INT NOT NULL,
  start_time INT COMMENT 'Seconds from demo start',
  duration_seconds INT,
  
  confidence_percent DECIMAL(5, 2),
  clip_description TEXT,
  
  clip_file_path VARCHAR(500),
  is_saved BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL,
  INDEX idx_match_clips (match_id),
  INDEX idx_player_clips (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ANALYSIS LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  
  analysis_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  progress_percent INT DEFAULT 0,
  
  total_events_processed INT DEFAULT 0,
  total_suspicious_activities_found INT DEFAULT 0,
  average_analysis_time_seconds DECIMAL(10, 2),
  
  error_message TEXT,
  analysis_notes TEXT,
  
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_match_logs (match_id),
  INDEX idx_status (analysis_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX idx_players_match_team ON players(match_id, team);
CREATE INDEX idx_stats_kd ON player_stats(kd_ratio);
CREATE INDEX idx_stats_accuracy ON player_stats(accuracy_percent);
CREATE INDEX idx_suspicious_confidence ON suspicious_activities(confidence_percent DESC);
CREATE INDEX idx_fraud_probability ON fraud_assessment(fraud_probability_percent DESC);

-- ============================================
-- Insert Sample Data (optional - for testing)
-- ============================================
-- Uncomment if you want sample data:
/*
INSERT INTO matches (demo_file_name, game_mode, map_name, match_date, duration_seconds) 
VALUES ('demo_test.dem', '5v5', 'Mirage', NOW(), 2700);
*/
