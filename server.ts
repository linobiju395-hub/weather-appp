import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Public config status (safe metadata only, no secrets exposed)
app.get('/api/config', (_req: Request, res: Response) => {
  const hasCustomKey = Boolean((process.env.WEATHER_API_KEY || 'e081756f27654a7ea71104112262909').trim().length > 0);
  const customUrl = process.env.WEATHER_API_URL || 'http://api.weatherapi.com/v1';
  const provider = process.env.WEATHER_PROVIDER || 'weatherapi';

  res.json({
    status: 'online',
    provider,
    hasCustomKey,
    hasCustomUrl: Boolean(customUrl),
    serverTime: new Date().toISOString(),
    proxyReady: true
  });
});

// Geocoding search endpoint
app.get('/api/geocode', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=8&language=en&format=json`;

    const response = await fetch(geocodeUrl);
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    const data = await response.json();
    const results = (data.results || []).map((item: any) => ({
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

    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Geocoding failed' });
  }
});

// Weather API endpoint
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? Number(req.query.lat) : 40.7128; // Default NYC
    const lon = req.query.lon ? Number(req.query.lon) : -74.0060;
    const units = (req.query.units as string) === 'imperial' ? 'imperial' : 'metric';
    const locationName = (req.query.locationName as string) || '';

    const customKey = (process.env.WEATHER_API_KEY || 'e081756f27654a7ea71104112262909').trim();
    const customUrl = (process.env.WEATHER_API_URL || 'http://api.weatherapi.com/v1').trim();
    const provider = process.env.WEATHER_PROVIDER || 'weatherapi';

    // 1. WeatherAPI.com Integration
    if (provider === 'weatherapi' && customKey) {
      try {
        const queryParam = `${lat},${lon}`;
        const weatherApiUrl = `${customUrl}/forecast.json?key=${customKey}&q=${queryParam}&days=3&aqi=yes&alerts=yes`;
        const weatherResp = await fetch(weatherApiUrl);
        if (weatherResp.ok) {
          const raw = await weatherResp.json();
          return res.json(normalizeWeatherApi(raw, units, locationName));
        } else {
          console.warn(`WeatherAPI returned ${weatherResp.status}, falling back to Open-Meteo`);
        }
      } catch (err) {
        console.warn('WeatherAPI request failed, falling back to Open-Meteo:', err);
      }
    }

    // 2. OpenWeatherMap integration
    if (provider === 'openweathermap' && customKey) {
      const baseUrl = customUrl || 'https://api.openweathermap.org/data/2.5';
      const unitParam = units === 'imperial' ? 'imperial' : 'metric';
      const weatherResp = await fetch(`${baseUrl}/weather?lat=${lat}&lon=${lon}&units=${unitParam}&appid=${customKey}`);
      if (weatherResp.ok) {
        const raw = await weatherResp.json();
        return res.json(normalizeOpenWeather(raw, units, locationName));
      }
    }

    // 2. Default & Highest-Fidelity Global Provider: Open-Meteo
    const tempUnitParam = units === 'imperial' ? '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch' : '';
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto${tempUnitParam}`;
    
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;

    const [forecastRes, aqiRes] = await Promise.allSettled([
      fetch(openMeteoUrl),
      fetch(airQualityUrl)
    ]);

    if (forecastRes.status !== 'fulfilled' || !forecastRes.value.ok) {
      throw new Error('Failed to fetch from Open-Meteo forecast API');
    }

    const forecastData = await forecastRes.value.json();
    let aqiData = null;
    if (aqiRes.status === 'fulfilled' && aqiRes.value.ok) {
      aqiData = await aqiRes.value.json();
    }

    const normalized = normalizeOpenMeteo(forecastData, aqiData, units, locationName);
    return res.json(normalized);
  } catch (error: any) {
    console.error('Weather API Proxy Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather data' });
  }
});

function getWmoCondition(code: number, isDay: number = 1): { condition: string; description: string; iconKey: string } {
  switch (code) {
    case 0:
      return {
        condition: isDay ? 'Clear' : 'Clear Night',
        description: isDay ? 'Clear blue skies with full solar irradiance' : 'Crisp clear starlit night',
        iconKey: isDay ? 'sunny' : 'clear-night'
      };
    case 1:
      return {
        condition: isDay ? 'Mainly Sunny' : 'Mainly Clear',
        description: 'Scattered high cirrus with generous sunlight',
        iconKey: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night'
      };
    case 2:
      return {
        condition: 'Partly Cloudy',
        description: 'Accumulating cumulus drifting across the horizon',
        iconKey: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night'
      };
    case 3:
      return {
        condition: 'Overcast',
        description: 'Dense stratocumulus shield blocking direct sunlight',
        iconKey: 'cloudy'
      };
    case 45:
      return {
        condition: 'Foggy',
        description: 'Low-lying radiational fog reducing surface visibility',
        iconKey: 'fog'
      };
    case 48:
      return {
        condition: 'Depositing Rime Fog',
        description: 'Freezing rime fog ice accumulation on surfaces',
        iconKey: 'fog'
      };
    case 51:
    case 53:
    case 55:
      return {
        condition: 'Drizzle',
        description: 'Light continuous mist droplets suspended in the air',
        iconKey: 'rain-light'
      };
    case 61:
      return {
        condition: 'Light Rain',
        description: 'Steady gentle rainfall freshening the atmosphere',
        iconKey: 'rain-light'
      };
    case 63:
      return {
        condition: 'Moderate Rain',
        description: 'Consistent rain bands passing over the region',
        iconKey: 'rain'
      };
    case 65:
      return {
        condition: 'Heavy Rain',
        description: 'Intense precipitation with potential surface runoff',
        iconKey: 'rain-heavy'
      };
    case 66:
    case 67:
      return {
        condition: 'Freezing Rain',
        description: 'Hazardous sub-freezing liquid glazing roads and powerlines',
        iconKey: 'sleet'
      };
    case 71:
      return {
        condition: 'Light Snow',
        description: 'Soft delicate flurries drifting gently',
        iconKey: 'snow-light'
      };
    case 73:
      return {
        condition: 'Moderate Snow',
        description: 'Steady accumulating snowfall with reduced visibility',
        iconKey: 'snow'
      };
    case 75:
      return {
        condition: 'Heavy Blizzard Snow',
        description: 'Heavy snowfall driven by gusty surface winds',
        iconKey: 'snow'
      };
    case 77:
      return {
        condition: 'Snow Grains',
        description: 'Frozen granular ice droplets falling briskly',
        iconKey: 'snow-light'
      };
    case 80:
    case 81:
    case 82:
      return {
        condition: 'Rain Showers',
        description: 'Rapid convective cloud bursts with intermittent breaks',
        iconKey: 'rain'
      };
    case 85:
    case 86:
      return {
        condition: 'Snow Showers',
        description: 'Transient convective snow bursts',
        iconKey: 'snow'
      };
    case 95:
      return {
        condition: 'Thunderstorm',
        description: 'Active cumulonimbus lightning, thunder, and heavy rain',
        iconKey: 'thunderstorm'
      };
    case 96:
    case 99:
      return {
        condition: 'Severe Hail Thunderstorm',
        description: 'Violent convective cell with damaging hail and strong shear',
        iconKey: 'thunderstorm-hail'
      };
    default:
      return {
        condition: 'Fair',
        description: 'Stable atmospheric conditions',
        iconKey: isDay ? 'sunny' : 'clear-night'
      };
  }
}

function normalizeOpenMeteo(forecast: any, aqi: any, units: 'metric' | 'imperial', locationName: string) {
  const current = forecast.current || {};
  const hourly = forecast.hourly || {};
  const daily = forecast.daily || {};
  const aqiCurrent = aqi?.current || {};

  const isDay = current.is_day ?? 1;
  const wmo = getWmoCondition(current.weather_code ?? 0, isDay);

  // Hourly mapping (next 24-48 hours)
  const hourlyTimes: string[] = hourly.time || [];
  const nowIso = new Date().toISOString();
  // Find current hour index or start from index 0
  const currentIndex = hourlyTimes.findIndex((t) => t >= nowIso.slice(0, 13)) || 0;
  const startIndex = Math.max(0, currentIndex);
  const nextHours = hourlyTimes.slice(startIndex, startIndex + 24).map((time, idx) => {
    const actualIdx = startIndex + idx;
    const hourCode = hourly.weather_code ? hourly.weather_code[actualIdx] : 0;
    const hourTime = new Date(time);
    const hourIsDay = hourTime.getHours() >= 6 && hourTime.getHours() <= 19 ? 1 : 0;
    const hourWmo = getWmoCondition(hourCode, hourIsDay);

    return {
      time,
      formattedTime: hourTime.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
      temperature: Math.round(hourly.temperature_2m?.[actualIdx] ?? 0),
      feelsLike: Math.round(hourly.apparent_temperature?.[actualIdx] ?? 0),
      precipitationProbability: hourly.precipitation_probability?.[actualIdx] ?? 0,
      precipitation: hourly.precipitation?.[actualIdx] ?? 0,
      weatherCode: hourCode,
      condition: hourWmo.condition,
      iconKey: hourWmo.iconKey,
      windSpeed: Math.round(hourly.wind_speed_10m?.[actualIdx] ?? 0),
      windDirection: hourly.wind_direction_10m?.[actualIdx] ?? 0,
      humidity: hourly.relative_humidity_2m?.[actualIdx] ?? 0,
      uvIndex: hourly.uv_index?.[actualIdx] ?? 0
    };
  });

  // Daily mapping (7 to 10 days)
  const dailyTimes: string[] = daily.time || [];
  const dailyForecast = dailyTimes.slice(0, 10).map((date, idx) => {
    const code = daily.weather_code?.[idx] ?? 0;
    const dayWmo = getWmoCondition(code, 1);
    const d = new Date(date + 'T12:00:00');
    const dayName = idx === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      date,
      dayName,
      formattedDate,
      weatherCode: code,
      condition: dayWmo.condition,
      description: dayWmo.description,
      iconKey: dayWmo.iconKey,
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

  // Calculate severe alerts based on actual meteorological thresholds
  const alerts: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'warning' | 'advisory' | 'watch';
    description: string;
    instruction: string;
    timestamp: string;
  }> = [];

  const windSpeed = current.wind_speed_10m ?? 0;
  const windGusts = current.wind_gusts_10m ?? 0;
  const rainAmount = current.precipitation ?? 0;
  const uvNow = current.uv_index ?? 0;
  const tempNow = current.temperature_2m ?? 20;

  if (windGusts > (units === 'imperial' ? 40 : 65)) {
    alerts.push({
      id: 'alert-wind-gusts',
      title: 'High Wind Advisory',
      severity: 'warning',
      description: `Damaging surface wind gusts reaching ${Math.round(windGusts)} ${units === 'imperial' ? 'mph' : 'km/h'} detected in this zone.`,
      instruction: 'Secure outdoor loose furniture, trash bins, and exercise caution when driving high-profile vehicles.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  if (current.weather_code === 95 || current.weather_code === 96 || current.weather_code === 99) {
    alerts.push({
      id: 'alert-thunderstorm',
      title: 'Severe Thunderstorm Warning',
      severity: 'critical',
      description: 'Active severe convective thunderstorm cluster with frequent cloud-to-ground lightning and torrential rain.',
      instruction: 'Seek immediate shelter in a sturdy building. Stay away from windows and metallic conductors.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } else if (rainAmount > (units === 'imperial' ? 0.4 : 10)) {
    alerts.push({
      id: 'alert-flood-rain',
      title: 'Heavy Rainfall Warning',
      severity: 'warning',
      description: `Intense localized precipitation rate of ${rainAmount} ${units === 'imperial' ? 'in/hr' : 'mm/hr'}. Local ponding likely.`,
      instruction: 'Allow extra commuting time and avoid flooded underpasses.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  if (uvNow >= 8) {
    alerts.push({
      id: 'alert-uv-extreme',
      title: 'Very High UV Radiation Alert',
      severity: 'advisory',
      description: `UV Index is currently ${Math.round(uvNow)} (Very High). Unprotected skin can burn within 15 minutes.`,
      instruction: 'Wear SPF 50+ sunscreen, UV-blocking sunglasses, and seek shade during midday hours.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  // Air Quality index & categories
  const usAqi = aqiCurrent.us_aqi ?? 42;
  let aqiCategory = 'Good';
  let aqiColor = '#10b981';
  let aqiHealthRecommendation = 'Air quality is considered satisfactory, and air pollution poses little or no risk.';

  if (usAqi > 300) {
    aqiCategory = 'Hazardous';
    aqiColor = '#7e22ce';
    aqiHealthRecommendation = 'Health warning of emergency conditions. The entire population is likely to be affected.';
  } else if (usAqi > 200) {
    aqiCategory = 'Very Unhealthy';
    aqiColor = '#ef4444';
    aqiHealthRecommendation = 'Health alert: everyone may experience more serious health effects. Avoid prolonged outdoor exertion.';
  } else if (usAqi > 150) {
    aqiCategory = 'Unhealthy';
    aqiColor = '#f97316';
    aqiHealthRecommendation = 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.';
  } else if (usAqi > 100) {
    aqiCategory = 'Moderate / Sensitive';
    aqiColor = '#eab308';
    aqiHealthRecommendation = 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
  } else if (usAqi > 50) {
    aqiCategory = 'Moderate';
    aqiColor = '#84cc16';
    aqiHealthRecommendation = 'Air quality is acceptable; however, some pollutants may cause moderate health concern for sensitive individuals.';
  }

  return {
    location: {
      name: locationName || 'Local Weather Station',
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
      humidity: current.relative_humidity_2m ?? 0,
      dewPoint: Math.round(hourly.dew_point_2m?.[currentIndex] ?? (current.temperature_2m - (100 - current.relative_humidity_2m) / 5)),
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      windGusts: Math.round(current.wind_gusts_10m ?? 0),
      windDirection: current.wind_direction_10m ?? 0,
      pressure: Math.round(current.pressure_msl ?? current.surface_pressure ?? 1013),
      uvIndex: current.uv_index ?? 0,
      cloudCover: current.cloud_cover ?? 0,
      visibility: Math.round((hourly.visibility?.[currentIndex] ?? 10000) / (units === 'imperial' ? 1609 : 1000)),
      precipitation: current.precipitation ?? 0,
      tempHighToday: dailyForecast[0]?.tempMax ?? Math.round(current.temperature_2m + 3),
      tempLowToday: dailyForecast[0]?.tempMin ?? Math.round(current.temperature_2m - 4),
      sunrise: dailyForecast[0]?.sunrise || '06:30',
      sunset: dailyForecast[0]?.sunset || '19:45'
    },
    airQuality: {
      aqi: usAqi,
      category: aqiCategory,
      color: aqiColor,
      recommendation: aqiHealthRecommendation,
      pm2_5: aqiCurrent.pm2_5 ? Number(aqiCurrent.pm2_5.toFixed(1)) : 8.4,
      pm10: aqiCurrent.pm10 ? Number(aqiCurrent.pm10.toFixed(1)) : 14.2,
      no2: aqiCurrent.nitrogen_dioxide ? Number(aqiCurrent.nitrogen_dioxide.toFixed(1)) : 12.0,
      o3: aqiCurrent.ozone ? Number(aqiCurrent.ozone.toFixed(1)) : 45.0,
      co: aqiCurrent.carbon_monoxide ? Number(aqiCurrent.carbon_monoxide.toFixed(1)) : 220.0
    },
    hourly: nextHours,
    daily: dailyForecast,
    alerts
  };
}

function normalizeWeatherApi(raw: any, units: 'metric' | 'imperial', locationName: string) {
  const loc = raw.location || {};
  const current = raw.current || {};
  const forecast = raw.forecast || {};
  const forecastDays = forecast.forecastday || [];
  const condition = current.condition || {};
  const isDay = current.is_day ?? 1;

  // Icon mapping
  const text = (condition.text || '').toLowerCase();
  let iconKey = isDay ? 'sunny' : 'clear-night';
  if (text.includes('thunder')) iconKey = 'thunderstorm';
  else if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) iconKey = 'rain';
  else if (text.includes('snow') || text.includes('blizzard') || text.includes('ice') || text.includes('sleet')) iconKey = 'snow';
  else if (text.includes('cloud') || text.includes('overcast')) iconKey = 'cloudy';
  else if (text.includes('mist') || text.includes('fog')) iconKey = 'fog';

  const today = forecastDays[0] || {};
  const todayDay = today.day || {};
  const todayAstro = today.astro || {};

  // Hourly mapping (from today and tomorrow)
  const hourlyRaw = today.hour || [];
  const hourly = hourlyRaw.map((h: any) => {
    const hText = (h.condition?.text || '').toLowerCase();
    let hIcon = h.is_day ? 'sunny' : 'clear-night';
    if (hText.includes('thunder')) hIcon = 'thunderstorm';
    else if (hText.includes('rain') || hText.includes('drizzle')) hIcon = 'rain';
    else if (hText.includes('snow')) hIcon = 'snow';
    else if (hText.includes('cloud') || hText.includes('overcast')) hIcon = 'cloudy';

    const timeDate = new Date(h.time);
    return {
      time: h.time,
      formattedTime: timeDate.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
      temperature: Math.round(units === 'imperial' ? h.temp_f : h.temp_c),
      feelsLike: Math.round(units === 'imperial' ? h.feelslike_f : h.feelslike_c),
      precipitationProbability: h.chance_of_rain ? Number(h.chance_of_rain) : 0,
      precipitation: units === 'imperial' ? h.precip_in : h.precip_mm,
      weatherCode: h.condition?.code || 1000,
      condition: h.condition?.text || 'Clear',
      iconKey: hIcon,
      windSpeed: Math.round(units === 'imperial' ? h.wind_mph : h.wind_kph),
      windDirection: h.wind_degree || 0,
      humidity: h.humidity || 50,
      uvIndex: h.uv || 0
    };
  });

  // Daily mapping
  const daily = forecastDays.map((d: any, idx: number) => {
    const dateObj = new Date(d.date + 'T12:00:00');
    const dayData = d.day || {};
    const dText = (dayData.condition?.text || '').toLowerCase();
    let dIcon = 'sunny';
    if (dText.includes('thunder')) dIcon = 'thunderstorm';
    else if (dText.includes('rain') || dText.includes('drizzle')) dIcon = 'rain';
    else if (dText.includes('snow')) dIcon = 'snow';
    else if (dText.includes('cloud') || dText.includes('overcast')) dIcon = 'cloudy';

    return {
      date: d.date,
      dayName: idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      formattedDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weatherCode: dayData.condition?.code || 1000,
      condition: dayData.condition?.text || 'Clear',
      description: dayData.condition?.text || 'Atmospheric trend',
      iconKey: dIcon,
      tempMax: Math.round(units === 'imperial' ? dayData.maxtemp_f : dayData.maxtemp_c),
      tempMin: Math.round(units === 'imperial' ? dayData.mintemp_f : dayData.mintemp_c),
      precipitationProbability: dayData.daily_chance_of_rain ? Number(dayData.daily_chance_of_rain) : 0,
      precipitationSum: units === 'imperial' ? dayData.totalprecip_in : dayData.totalprecip_mm,
      uvIndexMax: dayData.uv || 0,
      sunrise: d.astro?.sunrise || '06:00 AM',
      sunset: d.astro?.sunset || '07:00 PM',
      windSpeedMax: Math.round(units === 'imperial' ? dayData.maxwind_mph : dayData.maxwind_kph),
      windDirectionDominant: 0
    };
  });

  const aqiRaw = current.air_quality || {};
  const usAqi = aqiRaw['us-epa-index'] ? aqiRaw['us-epa-index'] * 25 : 35;

  return {
    location: {
      name: locationName || loc.name || 'Current Location',
      country: loc.country || '',
      latitude: loc.lat,
      longitude: loc.lon,
      timezone: loc.tz_id || 'UTC'
    },
    units,
    current: {
      time: loc.localtime || new Date().toISOString(),
      temperature: Math.round(units === 'imperial' ? current.temp_f : current.temp_c),
      feelsLike: Math.round(units === 'imperial' ? current.feelslike_f : current.feelslike_c),
      isDay,
      condition: condition.text || 'Sunny',
      description: condition.text || 'Clear weather',
      iconKey,
      weatherCode: condition.code || 1000,
      humidity: current.humidity || 50,
      dewPoint: Math.round(units === 'imperial' ? (current.dewpoint_f ?? (current.temp_f - 10)) : (current.dewpoint_c ?? (current.temp_c - 5))),
      windSpeed: Math.round(units === 'imperial' ? current.wind_mph : current.wind_kph),
      windGusts: Math.round(units === 'imperial' ? (current.gust_mph ?? current.wind_mph) : (current.gust_kph ?? current.wind_kph)),
      windDirection: current.wind_degree || 0,
      pressure: Math.round(current.pressure_mb || 1013),
      uvIndex: current.uv || 0,
      cloudCover: current.cloud || 0,
      visibility: Math.round(units === 'imperial' ? (current.vis_miles || 10) : (current.vis_km || 16)),
      precipitation: units === 'imperial' ? (current.precip_in || 0) : (current.precip_mm || 0),
      tempHighToday: Math.round(units === 'imperial' ? (todayDay.maxtemp_f ?? current.temp_f + 4) : (todayDay.maxtemp_c ?? current.temp_c + 2)),
      tempLowToday: Math.round(units === 'imperial' ? (todayDay.mintemp_f ?? current.temp_f - 4) : (todayDay.mintemp_c ?? current.temp_c - 2)),
      sunrise: todayAstro.sunrise || '06:00 AM',
      sunset: todayAstro.sunset || '07:00 PM'
    },
    airQuality: {
      aqi: usAqi,
      category: usAqi <= 50 ? 'Good' : usAqi <= 100 ? 'Moderate' : 'Unhealthy',
      color: usAqi <= 50 ? '#10b981' : '#eab308',
      recommendation: 'Air quality is normal.',
      pm2_5: aqiRaw.pm2_5 ? Number(aqiRaw.pm2_5.toFixed(1)) : 8.0,
      pm10: aqiRaw.pm10 ? Number(aqiRaw.pm10.toFixed(1)) : 14.0,
      no2: aqiRaw.no2 ? Number(aqiRaw.no2.toFixed(1)) : 10.0,
      o3: aqiRaw.o3 ? Number(aqiRaw.o3.toFixed(1)) : 40.0,
      co: aqiRaw.co ? Number(aqiRaw.co.toFixed(1)) : 200.0
    },
    hourly: hourly.slice(0, 24),
    daily,
    alerts: []
  };
}

function normalizeOpenWeather(raw: any, units: 'metric' | 'imperial', locationName: string) {
  const main = raw.main || {};
  const weather = raw.weather?.[0] || {};
  const wind = raw.wind || {};
  const sys = raw.sys || {};

  return {
    location: {
      name: locationName || raw.name || 'Current Location',
      latitude: raw.coord?.lat || 0,
      longitude: raw.coord?.lon || 0,
      country: sys.country || '',
      timezone: 'UTC'
    },
    units,
    current: {
      time: new Date().toISOString(),
      temperature: Math.round(main.temp ?? 0),
      feelsLike: Math.round(main.feels_like ?? 0),
      isDay: 1,
      condition: weather.main || 'Clear',
      description: weather.description || 'Clear skies',
      iconKey: weather.main?.toLowerCase().includes('rain') ? 'rain' : 'sunny',
      weatherCode: weather.id || 800,
      humidity: main.humidity ?? 50,
      dewPoint: Math.round(main.temp - 4),
      windSpeed: Math.round(wind.speed ?? 0),
      windGusts: Math.round(wind.gust ?? wind.speed ?? 0),
      windDirection: wind.deg ?? 0,
      pressure: main.pressure ?? 1013,
      uvIndex: 4,
      cloudCover: raw.clouds?.all ?? 0,
      visibility: Math.round((raw.visibility ?? 10000) / 1000),
      precipitation: 0,
      tempHighToday: Math.round(main.temp_max ?? main.temp),
      tempLowToday: Math.round(main.temp_min ?? main.temp),
      sunrise: sys.sunrise ? new Date(sys.sunrise * 1000).toISOString() : '',
      sunset: sys.sunset ? new Date(sys.sunset * 1000).toISOString() : ''
    },
    airQuality: {
      aqi: 35,
      category: 'Good',
      color: '#10b981',
      recommendation: 'Air quality is satisfactory.',
      pm2_5: 7.2,
      pm10: 12.0,
      no2: 10.5,
      o3: 40.0,
      co: 200.0
    },
    hourly: [],
    daily: [],
    alerts: []
  };
}

// Dev & Production serving
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AetherCast] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AetherCast] Failed to start server:', err);
  process.exit(1);
});
