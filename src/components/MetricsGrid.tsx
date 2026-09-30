import React from 'react';
import { CurrentWeather, AirQualityData, WeatherUnit } from '../types/weather';

interface MetricsGridProps {
  current: CurrentWeather;
  airQuality: AirQualityData;
  units: WeatherUnit;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ current, airQuality, units }) => {
  const uv = current.uvIndex;
  let uvCategory = 'Low';
  if (uv >= 11) uvCategory = 'Extreme';
  else if (uv >= 8) uvCategory = 'Very High';
  else if (uv >= 6) uvCategory = 'High';
  else if (uv >= 3) uvCategory = 'Moderate';

  const deg = current.windDirection;
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const windDirName = directions[Math.round(deg / 22.5) % 16] || 'N';

  const sunriseFormatted = current.sunrise
    ? new Date(current.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
  const sunsetFormatted = current.sunset
    ? new Date(current.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Wind */}
      <div className="bg-[#101622] rounded-xl border border-white/[0.06] p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Wind</span>
        <div className="my-2">
          <div className="text-xl font-semibold font-mono text-slate-100">
            {current.windSpeed}{' '}
            <span className="text-xs font-normal text-slate-400">
              {units === 'imperial' ? 'mph' : 'km/h'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {windDirName} · Gusts {current.windGusts} {units === 'imperial' ? 'mph' : 'km/h'}
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">Direction: {deg}°</div>
      </div>

      {/* 2. Humidity */}
      <div className="bg-[#101622] rounded-xl border border-white/[0.06] p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Humidity</span>
        <div className="my-2">
          <div className="text-xl font-semibold font-mono text-slate-100">
            {current.humidity}%
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Dew point {current.dewPoint}°
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {current.humidity > 65 ? 'High moisture' : 'Comfortable'}
        </div>
      </div>

      {/* 3. UV Index */}
      <div className="bg-[#101622] rounded-xl border border-white/[0.06] p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">UV Index</span>
        <div className="my-2">
          <div className="text-xl font-semibold font-mono text-slate-100">
            {Math.round(uv)}{' '}
            <span className="text-xs font-normal text-slate-400">/ 11+</span>
          </div>
          <div className="text-xs text-slate-300 mt-0.5">{uvCategory}</div>
        </div>
        <div className="text-[11px] text-slate-500">
          {uv >= 6 ? 'Protection needed' : 'Low exposure'}
        </div>
      </div>

      {/* 4. Air Quality */}
      <div className="bg-[#101622] rounded-xl border border-white/[0.06] p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Air Quality</span>
        <div className="my-2">
          <div className="text-xl font-semibold font-mono text-slate-100">
            {airQuality.aqi}{' '}
            <span className="text-xs font-normal text-slate-400">AQI</span>
          </div>
          <div className="text-xs text-slate-300 mt-0.5">{airQuality.category}</div>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">PM2.5: {airQuality.pm2_5}</div>
      </div>

      {/* 5. Pressure */}
      <div className="bg-[#101622] rounded-xl border border-white/[0.06] p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Pressure</span>
        <div className="my-2">
          <div className="text-xl font-semibold font-mono text-slate-100">
            {current.pressure}{' '}
            <span className="text-xs font-normal text-slate-400">hPa</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {(current.pressure * 0.02953).toFixed(2)} inHg
          </div>
        </div>
        <div className="text-[11px] text-slate-500">Standard sea-level</div>
      </div>

      {/* 6. Sun Schedule */}
      <div className="bg-[#101622] rounded-xl border border-white/[0.06] p-4 flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Sun Schedule</span>
        <div className="my-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Rise</span>
            <span className="font-mono text-slate-200">{sunriseFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Set</span>
            <span className="font-mono text-slate-200">{sunsetFormatted}</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">Visibility {current.visibility} {units === 'imperial' ? 'mi' : 'km'}</div>
      </div>
    </section>
  );
};
