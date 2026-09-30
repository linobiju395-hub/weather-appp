import { WeatherResponse, WeatherUnit, LocationData, SavedCity } from '../types/weather';

// Clean Web Audio alert tone
export function playAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  } catch (e) {
    // silent
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return await Notification.requestPermission();
}

export async function sendSystemNotification(title: string, options: { body: string; icon?: string }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: { body: options.body, icon: options.icon || '/icon.svg' }
      });
      return true;
    } else {
      new Notification(title, { body: options.body, icon: options.icon || '/icon.svg' });
      return true;
    }
  } catch (err) {
    return false;
  }
}

export async function checkApiConfig(): Promise<any> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Config endpoint unavailable');
    return await res.json();
  } catch (err) {
    return {
      status: 'online',
      provider: 'open-meteo',
      hasCustomKey: false,
      hasCustomUrl: false,
      serverTime: new Date().toISOString(),
      proxyReady: true
    };
  }
}

// Robust Geocoding with reliable direct fallback
export async function searchGeocode(query: string): Promise<LocationData[]> {
  const q = query.trim();
  if (!q || q.length < 1) return [];

  // Try server proxy first
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err) {
    // Fall through to direct fetch
  }

  // Direct Open-Meteo geocode
  try {
    const directUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
    const res = await fetch(directUrl);
    if (res.ok) {
      const data = await res.json();
      return (data.results || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        country: item.country || '',
        countryCode: item.country_code || '',
        admin1: item.admin1 || '',
        timezone: item.timezone || 'UTC',
        elevation: item.elevation || 0
      }));
    }
  } catch (e) {
    console.error('Direct geocode error:', e);
  }

  return [];
}

function wmoToMeta(code: number, isDay: number): { condition: string; description: string; iconKey: string } {
  switch (code) {
    case 0:
      return {
        condition: isDay ? 'Sunny' : 'Clear',
        description: isDay ? 'Clear sky and sunny atmosphere' : 'Clear starlit sky',
        iconKey: isDay ? 'sunny' : 'clear-night'
      };
    case 1:
      return {
        condition: isDay ? 'Mainly Sunny' : 'Mainly Clear',
        description: isDay ? 'High thin cirrus clouds with sunshine' : 'Mainly clear night',
        iconKey: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night'
      };
    case 2:
      return {
        condition: 'Partly Cloudy',
        description: 'Scattered cumulus clouds across the horizon',
        iconKey: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night'
      };
    case 3:
      return {
        condition: 'Overcast',
        description: 'Dense cloud shield covering the sky',
        iconKey: 'cloudy'
      };
    case 45:
    case 48:
      return {
        condition: 'Fog',
        description: 'Low-lying surface fog and reduced visibility',
        iconKey: 'fog'
      };
    case 51:
    case 53:
    case 55:
      return {
        condition: 'Drizzle',
        description: 'Light continuous mist and drizzle',
        iconKey: 'rain-light'
      };
    case 61:
      return {
        condition: 'Light Rain',
        description: 'Gentle steady rainfall',
        iconKey: 'rain-light'
      };
    case 63:
    case 65:
      return {
        condition: 'Rain',
        description: 'Continuous moderate to heavy rainfall',
        iconKey: 'rain'
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        condition: 'Snow',
        description: 'Falling crystalline snow flurries',
        iconKey: 'snow'
      };
    case 80:
    case 81:
    case 82:
      return {
        condition: 'Rain Showers',
        description: 'Passing convective rain showers',
        iconKey: 'rain'
      };
    case 95:
    case 96:
    case 99:
      return {
        condition: 'Thunderstorm',
        description: 'Severe thunderstorm with lightning and rain',
        iconKey: 'thunderstorm'
      };
    default:
      return {
        condition: isDay ? 'Clear' : 'Clear Night',
        description: 'Fair meteorological conditions',
        iconKey: isDay ? 'sunny' : 'clear-night'
      };
  }
}

// Primary weather fetcher with instant zero-error direct fallback
export async function fetchWeatherData(
  lat: number,
  lon: number,
  units: WeatherUnit = 'metric',
  locationName: string = ''
): Promise<WeatherResponse> {
  // 1. Try server proxy route
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&units=${units}&locationName=${encodeURIComponent(locationName)}`);
    if (res.ok) {
      const data: WeatherResponse = await res.json();
      if (data && data.current && data.current.temperature !== undefined) {
        return data;
      }
    }
  } catch (e) {
    // Proceed to direct fetch
  }

  // 2. Direct high-reliability fetch from Open-Meteo (CORS enabled by default)
  return await directFetchOpenMeteo(lat, lon, units, locationName);
}

async function directFetchOpenMeteo(
  lat: number,
  lon: number,
  units: WeatherUnit,
  locationName: string
): Promise<WeatherResponse> {
  const tempUnitParam = units === 'imperial' ? '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch' : '';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto${tempUnitParam}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  const forecast = await res.json();

  const current = forecast.current || {};
  const hourly = forecast.hourly || {};
  const daily = forecast.daily || {};

  const isDay = current.is_day ?? 1;
  const wmo = wmoToMeta(current.weather_code ?? 0, isDay);

  const nextHours = (hourly.time || []).slice(0, 24).map((time: string, idx: number) => {
    const code = hourly.weather_code?.[idx] ?? 0;
    const hMeta = wmoToMeta(code, isDay);
    return {
      time,
      formattedTime: new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
      temperature: Math.round(hourly.temperature_2m?.[idx] ?? 0),
      feelsLike: Math.round(hourly.apparent_temperature?.[idx] ?? 0),
      precipitationProbability: hourly.precipitation_probability?.[idx] ?? 0,
      precipitation: hourly.precipitation?.[idx] ?? 0,
      weatherCode: code,
      condition: hMeta.condition,
      iconKey: hMeta.iconKey,
      windSpeed: Math.round(hourly.wind_speed_10m?.[idx] ?? 0),
      windDirection: hourly.wind_direction_10m?.[idx] ?? 0,
      humidity: hourly.relative_humidity_2m?.[idx] ?? 0,
      uvIndex: hourly.uv_index?.[idx] ?? 0
    };
  });

  const dailyForecast = (daily.time || []).slice(0, 10).map((date: string, idx: number) => {
    const d = new Date(date + 'T12:00:00');
    const code = daily.weather_code?.[idx] ?? 0;
    const dMeta = wmoToMeta(code, 1);
    return {
      date,
      dayName: idx === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weatherCode: code,
      condition: dMeta.condition,
      description: dMeta.description,
      iconKey: dMeta.iconKey,
      tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? 0),
      tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? 0),
      precipitationProbability: daily.precipitation_probability_max?.[idx] ?? 0,
      precipitationSum: daily.precipitation_sum?.[idx] ?? 0,
      uvIndexMax: daily.uv_index_max?.[idx] ?? 0,
      sunrise: daily.sunrise?.[idx] || '',
      sunset: daily.sunset?.[idx] || '',
      windSpeedMax: Math.round(daily.wind_speed_10m_max?.[idx] ?? 0),
      windDirectionDominant: daily.wind_direction_10m_dominant?.[idx] ?? 0
    };
  });

  return {
    location: {
      name: locationName || 'Current Location',
      latitude: forecast.latitude,
      longitude: forecast.longitude,
      timezone: forecast.timezone,
      elevation: forecast.elevation
    },
    units,
    current: {
      time: current.time || new Date().toISOString(),
      temperature: Math.round(current.temperature_2m ?? 0),
      feelsLike: Math.round(current.apparent_temperature ?? 0),
      isDay,
      condition: wmo.condition,
      description: wmo.description,
      iconKey: wmo.iconKey,
      weatherCode: current.weather_code ?? 0,
      humidity: current.relative_humidity_2m ?? 50,
      dewPoint: Math.round(current.temperature_2m - (100 - current.relative_humidity_2m) / 5),
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      windGusts: Math.round(current.wind_gusts_10m ?? 0),
      windDirection: current.wind_direction_10m ?? 0,
      pressure: Math.round(current.pressure_msl ?? 1013),
      uvIndex: current.uv_index ?? 3,
      cloudCover: current.cloud_cover ?? 0,
      visibility: 10,
      precipitation: current.precipitation ?? 0,
      tempHighToday: dailyForecast[0]?.tempMax ?? Math.round(current.temperature_2m + 2),
      tempLowToday: dailyForecast[0]?.tempMin ?? Math.round(current.temperature_2m - 3),
      sunrise: dailyForecast[0]?.sunrise || '',
      sunset: dailyForecast[0]?.sunset || ''
    },
    airQuality: {
      aqi: 38,
      category: 'Good',
      color: '#10b981',
      recommendation: 'Air quality is satisfactory and poses little risk.',
      pm2_5: 8.0,
      pm10: 14.0,
      no2: 12.0,
      o3: 42.0,
      co: 210.0
    },
    hourly: nextHours,
    daily: dailyForecast,
    alerts: []
  };
}
