export interface NetworkSettings {
  wsBaseUrl: string;
  photogrammetryApiUrl: string;
  detectionApiUrl: string;
}

export interface SettingsState {
  networkSettings: NetworkSettings;
}
