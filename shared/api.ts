/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export interface PlayerStats {
  name: string;
  steam_id: string;
  team: string;
  kills: number;
  deaths: number;
  assists: number;
}

export interface DemoAnalysisResponse {
  success: boolean;
  map: string;
  players: PlayerStats[];
  score: { team_a: number; team_b: number };
  rounds: number;
  error?: string;
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
