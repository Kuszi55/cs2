export interface PlayerStats {
  name: string;
  steam_id: string | number;
  kills: number;
  deaths: number;
  assists: number;
}

export interface DemoAnalysisResponse {
  success: boolean;
  map: string;
  players: PlayerStats[];
  error?: string;
}

export interface DemoUploadResponse {
  message: string;
}
