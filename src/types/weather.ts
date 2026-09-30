export type WeatherUnit = 'metric' | 'imperial';

export type RadarLayer = 'radar' | 'clouds' | 'wind' | 'temp';

export interface LocationData {
  id?: number | string;
  name: string;
  country?: string;
  countryCode?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  elevation?: number;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  feelsLike: number;
  isDay: number;
  condition: string;
  description: string;
  iconKey: string;
  weatherCode: number;
  humidity: number;
  dewPoint: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  pressure: number;
  uvIndex: number;
  cloudCover: number;
  visibility: number;
  precipitation: number;
  tempHighToday: number;
  tempLowToday: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyItem {
  time: string;
  formattedTime: string;
  temperature: number;
  feelsLike: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  condition: string;
  iconKey: string;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  uvIndex: number;
}

export interface DailyItem {
  date: string;
  dayName: string;
  formattedDate: string;
  weatherCode: number;
  condition: string;
  description: string;
  iconKey: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  precipitationSum: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  windSpeedMax: number;
  windDirectionDominant: number;
}

export interface AirQualityData {
  aqi: number;
  category: string;
  color: string;
  recommendation: string;
  pm2_5: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'advisory' | 'watch';
  description: string;
  instruction: string;
  timestamp: string;
}

export interface WeatherResponse {
  location: LocationData;
  units: WeatherUnit;
  current: CurrentWeather;
  airQuality: AirQualityData;
  hourly: HourlyItem[];
  daily: DailyItem[];
  alerts: WeatherAlert[];
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  pollingIntervalMinutes: number; // 5, 15, 30, 60
  rainAlerts: boolean;
  windAlerts: boolean;
  extremeTempAlerts: boolean;
  severeStormAlerts: boolean;
  morningBriefing: boolean;
}

export interface NotificationLog {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'advisory' | 'info';
  timestamp: string;
  read: boolean;
}

export interface SavedCity extends LocationData {
  lastTemp?: number;
  lastCondition?: string;
  lastIconKey?: string;
}

export interface ApiConfigStatus {
  status: string;
  provider: string;
  hasCustomKey: boolean;
  hasCustomUrl: boolean;
  serverTime: string;
  proxyReady: boolean;
}
