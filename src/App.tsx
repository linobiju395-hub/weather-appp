import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sun,
  Sunrise,
  Sunset,
  CloudRain,
  Compass,
  Sparkles,
  Loader2,
  AlertCircle,
  Activity
} from 'lucide-react';
import {
  WeatherResponse,
  WeatherUnit,
  LocationData
} from './types/weather';
import {
  fetchWeatherData,
  searchGeocode
} from './services/weatherService';
import { WeatherIcon } from './components/WeatherIcons';
import { WeatherSkyBackground } from './components/WeatherSkyBackground';

const DEFAULT_CITY: LocationData = {
  name: 'Dubai',
  country: 'United Arab Emirates',
  latitude: 25.2048,
  longitude: 55.2708,
  timezone: 'Asia/Dubai'
};

const PRESET_CITIES: LocationData[] = [
  { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708 },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 }
];

export default function App() {
  const [currentCity, setCurrentCity] = useState<LocationData>(() => {
    const saved = localStorage.getItem('aethercast_current_city');
    return saved ? JSON.parse(saved) : DEFAULT_CITY;
  });

  const [units, setUnits] = useState<WeatherUnit>(() => {
    return (localStorage.getItem('aethercast_units') as WeatherUnit) || 'metric';
  });

  const [searchInput, setSearchInput] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist city & units
  useEffect(() => {
    localStorage.setItem('aethercast_current_city', JSON.stringify(currentCity));
  }, [currentCity]);

  useEffect(() => {
    localStorage.setItem('aethercast_units', units);
  }, [units]);

  // Load weather
  const loadWeather = async (city: LocationData, targetUnits: WeatherUnit) => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchWeatherData(city.latitude, city.longitude, targetUnits, city.name);
      setWeatherData(data);
    } catch (err: any) {
      console.error('Weather load error:', err);
      setFetchError('Could not retrieve weather for this location.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(currentCity, units);
  }, [currentCity, units]);

  // Live search debounce
  useEffect(() => {
    const q = searchInput.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchGeocode(q);
      setSearchResults(results);
      setIsSearching(false);
      setShowSearchResults(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;

    setIsSearching(true);
    const results = await searchGeocode(q);
    setIsSearching(false);

    if (results && results.length > 0) {
      const best = results[0];
      setCurrentCity(best);
      setSearchInput('');
      setShowSearchResults(false);
    } else {
      setFetchError(`Could not find location "${q}". Please check the spelling.`);
    }
  };

  const handleSelectSearchResult = (loc: LocationData) => {
    setCurrentCity(loc);
    setSearchInput('');
    setShowSearchResults(false);
  };

  // Helper for generating smart clothing/activity advice
  const getSmartAdvisory = (w: WeatherResponse) => {
    const tempC = units === 'metric' ? w.current.temperature : Math.round((w.current.temperature - 32) * (5 / 9));
    const cond = (w.current.condition || '').toLowerCase();

    let attire = 'Comfortable casual wear';
    let outdoor = 'Great conditions for outdoor walks and recreation.';

    if (tempC >= 32) {
      attire = 'Light breathable linen or cotton, sunglasses, and UV sunscreen.';
      outdoor = 'High heat index — stay hydrated and seek shade during midday hours.';
    } else if (tempC >= 22) {
      attire = 'T-shirt, light trousers or shorts. Perfect outdoor temperature.';
      outdoor = 'Ideal weather for outdoor dining, sports, and sightseeing.';
    } else if (tempC >= 14) {
      attire = 'Light jacket, pullover, or cardigan recommended.';
      outdoor = 'Crisp and pleasant for jogging and brisk strolls.';
    } else if (tempC >= 5) {
      attire = 'Warm coat, layered sweater, and long pants.';
      outdoor = 'Chilly breeze — brisk walk recommended; bundle up if staying outside.';
    } else {
      attire = 'Heavy winter coat, scarf, gloves, and insulated footwear.';
      outdoor = 'Sub-zero temperatures — minimize prolonged cold exposure.';
    }

    if (cond.includes('rain') || cond.includes('drizzle')) {
      attire += ' Waterproof umbrella and rain boots advised.';
      outdoor = 'Wet surfaces — indoor activities or covered walkways recommended.';
    } else if (cond.includes('thunder')) {
      outdoor = 'Active thunderstorm cell — remain safely sheltered indoors.';
    } else if (cond.includes('snow')) {
      attire += ' Winter boots with traction tread recommended.';
    }

    return { attire, outdoor };
  };

  const activeIconKey = weatherData?.current.iconKey || 'sunny';
  const isDay = weatherData?.current.isDay ?? 1;
  const advisory = weatherData ? getSmartAdvisory(weatherData) : null;

  return (
    <div className="relative min-h-screen text-white font-['Times_New_Roman',Times,serif] selection:bg-white/30 selection:text-white flex flex-col">
      {/* Dynamic Animated Sky (Sunbeams, Raindrops, Lightning, Snow, Clouds) */}
      <WeatherSkyBackground iconKey={activeIconKey} isDay={isDay} />

      {/* Main Glass Floating Header */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 pt-5 pb-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Search Box */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-lg">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                placeholder="Search city, e.g. Dubai, London, Tokyo..."
                className="w-full pl-5 pr-24 py-3 rounded-2xl bg-white/20 hover:bg-white/25 focus:bg-white/30 backdrop-blur-md border border-white/30 text-white placeholder:text-white/70 text-base font-normal focus:outline-none transition-all shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-white/30 hover:bg-white/40 active:scale-95 text-white text-sm font-semibold backdrop-blur-sm transition-all"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Live Autocomplete Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl z-50 max-h-72 overflow-y-auto thin-scrollbar">
                {searchResults.map((r, i) => (
                  <button
                    key={`${r.latitude}-${r.longitude}-${i}`}
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/15 text-left text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-white block">{r.name}</span>
                        <span className="text-white/70 text-xs">
                          {[r.admin1, r.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-white/50 text-xs">
                      {r.latitude.toFixed(1)}°, {r.longitude.toFixed(1)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUnits((u) => (u === 'metric' ? 'imperial' : 'metric'))}
              title="Toggle Unit (°C / °F)"
              className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-base text-white shadow-lg transition-all"
            >
              °{units === 'metric' ? 'C' : 'F'}
            </button>
          </div>
        </div>

        {/* Quick Location Pills */}
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto thin-scrollbar pt-3 pb-1">
          <span className="text-sm text-white/80 font-medium whitespace-nowrap pl-1">
            Popular:
          </span>
          {PRESET_CITIES.map((c) => (
            <button
              key={`preset-${c.name}`}
              onClick={() => setCurrentCity(c)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all backdrop-blur-md border ${
                currentCity.name.toLowerCase() === c.name.toLowerCase()
                  ? 'bg-white text-slate-900 border-white shadow-md'
                  : 'bg-white/15 text-white border-white/25 hover:bg-white/25'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Glass Weather Dashboard */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-4 space-y-6">
        {/* Error notification if any */}
        {fetchError && (
          <div className="p-4 rounded-2xl bg-rose-500/25 border border-rose-300/40 backdrop-blur-md flex items-center justify-between text-sm text-white shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-200 flex-shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={() => loadWeather(currentCity, units)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Big Hero Card */}
        {weatherData && (
          <div className="relative rounded-3xl bg-white/15 backdrop-blur-2xl border border-white/30 p-8 sm:p-10 shadow-2xl overflow-hidden transition-all">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              {/* Left Details */}
              <div>
                <div className="flex items-center gap-2 text-base font-semibold tracking-wide text-white/90 mb-1">
                  <MapPin className="w-4 h-4 text-white" />
                  <span className="text-xl">{weatherData.location.name}</span>
                  {weatherData.location.country && (
                    <span className="text-white/70">· {weatherData.location.country}</span>
                  )}
                </div>

                {/* Primary Temperature */}
                <div className="flex items-baseline my-2">
                  <span className="text-7xl sm:text-8xl lg:text-9xl font-light tracking-tighter text-white drop-shadow-md">
                    {weatherData.current.temperature}
                  </span>
                  <span className="text-3xl sm:text-4xl font-light text-white/80 ml-2">
                    °{units === 'metric' ? 'C' : 'F'}
                  </span>
                </div>

                {/* Condition and High / Low spelled out */}
                <div className="space-y-1.5 text-base font-medium text-white/90">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                    {weatherData.current.condition}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-white/85 text-base">
                    <span>Feels like {weatherData.current.feelsLike}°</span>
                    <span>·</span>
                    <span className="font-semibold">High: {weatherData.current.tempHighToday}°</span>
                    <span>·</span>
                    <span className="font-semibold">Low: {weatherData.current.tempLowToday}°</span>
                  </div>
                </div>
              </div>

              {/* Big Animated Icon */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 shadow-xl">
                  <WeatherIcon
                    iconKey={activeIconKey}
                    size={110}
                    animate={true}
                    className="drop-shadow-2xl"
                  />
                </div>
                <div className="text-center max-w-[220px]">
                  <span className="text-sm text-white/85 font-medium leading-relaxed block">
                    {weatherData.current.description}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature 1: Smart Daily Living & Attire Advisory */}
        {advisory && (
          <div className="rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 p-6 shadow-xl">
            <div className="flex items-center gap-2.5 text-white mb-3">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-base font-bold tracking-tight">Today's Dressing & Living Advisory</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <div className="font-semibold text-amber-200 mb-1">Recommended Attire</div>
                <div className="text-white/90 leading-relaxed">{advisory.attire}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <div className="font-semibold text-cyan-200 mb-1">Outdoor & Activity Conditions</div>
                <div className="text-white/90 leading-relaxed">{advisory.outdoor}</div>
              </div>
            </div>
          </div>
        )}

        {/* 24-Hour Hourly Forecast Scrubber */}
        {weatherData && (
          <div className="rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 p-6 shadow-xl">
            <h3 className="text-base font-bold tracking-tight text-white mb-4">
              24-Hour Hourly Forecast
            </h3>

            <div className="flex gap-3 overflow-x-auto thin-scrollbar pb-2">
              {weatherData.hourly.map((h, i) => (
                <div
                  key={h.time}
                  className={`flex-shrink-0 w-22 py-3 px-2 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
                    i === 0
                      ? 'bg-white/30 border border-white/40 shadow-sm'
                      : 'bg-white/10 border border-white/15 hover:bg-white/20'
                  }`}
                >
                  <span className="text-xs font-medium text-white/80">
                    {i === 0 ? 'Now' : h.formattedTime}
                  </span>

                  <div className="my-2">
                    <WeatherIcon iconKey={h.iconKey} size={32} animate={true} />
                  </div>

                  <span className="text-base font-bold text-white">
                    {h.temperature}°
                  </span>

                  <div className="mt-2 text-xs text-cyan-200 font-semibold">
                    {h.precipitationProbability > 0 ? `${h.precipitationProbability}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 2: Air Quality Index & Ephemeris (Sunrise/Sunset) */}
        {weatherData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Air Quality Card */}
            <div className="p-6 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Activity className="w-4 h-4 text-emerald-300" />
                  <span>Air Quality Index</span>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-900"
                  style={{ backgroundColor: weatherData.airQuality.color || '#10b981' }}
                >
                  {weatherData.airQuality.category}
                </span>
              </div>

              <div className="my-4">
                <div className="text-4xl font-light text-white">
                  {weatherData.airQuality.aqi}
                  <span className="text-xs text-white/70 ml-2 font-normal">US AQI</span>
                </div>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  {weatherData.airQuality.recommendation}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-xs text-white/75">
                <div>
                  <span className="block text-white/60">PM 2.5</span>
                  <span className="font-semibold text-white">{weatherData.airQuality.pm2_5} µg/m³</span>
                </div>
                <div>
                  <span className="block text-white/60">PM 10</span>
                  <span className="font-semibold text-white">{weatherData.airQuality.pm10} µg/m³</span>
                </div>
                <div>
                  <span className="block text-white/60">Ozone</span>
                  <span className="font-semibold text-white">{weatherData.airQuality.o3} µg/m³</span>
                </div>
              </div>
            </div>

            {/* Sun Astro Card */}
            <div className="p-6 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-xl flex flex-col justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sun className="w-4 h-4 text-amber-300" />
                <span>Solar Ephemeris & Daylight</span>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-3">
                  <Sunrise className="w-7 h-7 text-amber-300 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-white/70 block">Sunrise</span>
                    <span className="text-base font-bold text-white">
                      {weatherData.current.sunrise || '06:15 AM'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-3">
                  <Sunset className="w-7 h-7 text-orange-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-white/70 block">Sunset</span>
                    <span className="text-base font-bold text-white">
                      {weatherData.current.sunset || '06:45 PM'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/75 pt-2 border-t border-white/15">
                <span>Visibility: {weatherData.current.visibility} {units === 'imperial' ? 'miles' : 'km'}</span>
                <span>Cloud Cover: {weatherData.current.cloudCover}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Atmospheric Metrics Grid */}
        {weatherData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 flex flex-col justify-between shadow-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                <Wind className="w-4 h-4 text-cyan-200" />
                <span>Wind Speed</span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-bold text-white">
                  {weatherData.current.windSpeed}{' '}
                  <span className="text-xs font-normal text-white/70">
                    {units === 'imperial' ? 'mph' : 'km/h'}
                  </span>
                </div>
                <div className="text-xs text-white/70 mt-0.5">
                  Gusts to {weatherData.current.windGusts} {units === 'imperial' ? 'mph' : 'km/h'}
                </div>
              </div>
              <div className="text-xs text-white/60">Direction: {weatherData.current.windDirection}°</div>
            </div>

            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 flex flex-col justify-between shadow-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                <Droplets className="w-4 h-4 text-cyan-200" />
                <span>Humidity</span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-bold text-white">
                  {weatherData.current.humidity}%
                </div>
                <div className="text-xs text-white/70 mt-0.5">
                  Dew point {weatherData.current.dewPoint}°
                </div>
              </div>
              <div className="text-xs text-white/60">
                {weatherData.current.humidity > 60 ? 'Humid air' : 'Comfortable'}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 flex flex-col justify-between shadow-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                <Sun className="w-4 h-4 text-amber-300" />
                <span>UV Index</span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-bold text-white">
                  {Math.round(weatherData.current.uvIndex)}
                </div>
                <div className="text-xs text-white/70 mt-0.5">
                  {weatherData.current.uvIndex >= 6 ? 'High Exposure' : 'Low Exposure'}
                </div>
              </div>
              <div className="text-xs text-white/60">Solar intensity</div>
            </div>

            <div className="p-5 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 flex flex-col justify-between shadow-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                <Gauge className="w-4 h-4 text-cyan-200" />
                <span>Air Pressure</span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-bold text-white">
                  {weatherData.current.pressure}{' '}
                  <span className="text-xs font-normal text-white/70">hPa</span>
                </div>
                <div className="text-xs text-white/70 mt-0.5">
                  {(weatherData.current.pressure * 0.02953).toFixed(2)} inHg
                </div>
              </div>
              <div className="text-xs text-white/60">Atmospheric pressure</div>
            </div>
          </div>
        )}

        {/* 10-Day Outlook List */}
        {weatherData && (
          <div className="rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 p-6 sm:p-8 shadow-xl">
            <h3 className="text-base font-bold tracking-tight text-white mb-4">
              10-Day Extended Forecast
            </h3>

            <div className="divide-y divide-white/15">
              {weatherData.daily.map((day, idx) => (
                <div
                  key={day.date}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="w-24">
                    <span className="font-semibold text-white block text-base">
                      {idx === 0 ? 'Today' : day.dayName}
                    </span>
                    <span className="text-xs text-white/70">
                      {day.formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-36">
                    <WeatherIcon iconKey={day.iconKey} size={28} animate={true} />
                    <span className="text-sm text-white/90 truncate">{day.condition}</span>
                  </div>

                  <div className="w-12 text-sm text-cyan-200 font-semibold">
                    {day.precipitationProbability > 10 ? `${day.precipitationProbability}%` : ''}
                  </div>

                  <div className="flex items-center gap-3 text-base">
                    <span className="text-white/70 w-8 text-right">{day.tempMin}°</span>
                    <div className="w-24 sm:w-36 h-2 rounded-full bg-white/20 relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-2 right-4 rounded-full bg-gradient-to-r from-cyan-300 to-amber-300" />
                    </div>
                    <span className="font-bold text-white w-8 text-left">{day.tempMax}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/20 py-6 text-center text-xs text-white/70">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-8">
          <span>AetherCast Weather</span>
          <span className="text-white/60">Powered by WeatherAPI.com</span>
        </div>
      </footer>
    </div>
  );
}
