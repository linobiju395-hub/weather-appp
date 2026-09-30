import React from 'react';
import { WeatherIcon } from './WeatherIcons';

interface WeatherHeroCardProps {
  locationName: string;
  country?: string;
  timezone?: string;
  temperature: number;
  feelsLike: number;
  tempHigh: number;
  tempLow: number;
  condition: string;
  description: string;
  iconKey: string;
  units: 'metric' | 'imperial';
  isDay: number;
  onSelectCondition?: (condKey: string) => void;
}

export const WeatherHeroCard: React.FC<WeatherHeroCardProps> = ({
  locationName,
  country,
  timezone,
  temperature,
  feelsLike,
  tempHigh,
  tempLow,
  condition,
  description,
  iconKey,
  units,
  isDay,
  onSelectCondition
}) => {
  // Weather condition test triggers for instant preview
  const conditionPresets = [
    { key: 'sunny', label: '☀️ Sunny' },
    { key: 'cloudy', label: '☁️ Overcast' },
    { key: 'rain', label: '🌧️ Raining' },
    { key: 'thunderstorm', label: '⛈️ Thunder' },
    { key: 'snow', label: '❄️ Snow' }
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111726]/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl transition-all">
      {/* Subtle ambient light gradient matching weather inside card */}
      {iconKey === 'sunny' && (
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {(iconKey.includes('rain') || iconKey.includes('thunderstorm')) && (
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {iconKey.includes('snow') && (
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Location & Primary Temperature */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 font-medium">
            <span>{locationName}</span>
            {country && <span>· {country}</span>}
            {timezone && <span>· {timezone}</span>}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-6xl sm:text-7xl lg:text-8xl font-light font-mono tabular-nums tracking-tight text-white drop-shadow-sm">
              {temperature}
            </span>
            <span className="text-2xl sm:text-3xl font-light font-mono text-slate-400">
              °{units === 'metric' ? 'C' : 'F'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300 mt-2 font-medium">
            <span className="text-white font-semibold">{condition}</span>
            <span className="text-slate-600">·</span>
            <span>Feels like {feelsLike}°</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">H: {tempHigh}° L: {tempLow}°</span>
          </div>

          {/* Quick weather interactive selector for instant visual confirmation */}
          {onSelectCondition && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/[0.06]">
              <span className="text-[11px] text-slate-400 mr-1">Preview Atmosphere:</span>
              {conditionPresets.map((p) => (
                <button
                  key={p.key}
                  onClick={() => onSelectCondition(p.key)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                    iconKey === p.key
                      ? 'bg-white/20 text-white font-medium shadow-sm'
                      : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Large Animated Meteorological Icon with Description */}
        <div className="flex items-center gap-5 border-t md:border-t-0 md:border-l border-white/[0.06] pt-4 md:pt-0 md:pl-8">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shadow-inner">
            <WeatherIcon
              iconKey={iconKey}
              size={80}
              animate={true}
              className="drop-shadow-lg"
            />
          </div>
          <div className="space-y-1 max-w-[220px]">
            <div className="text-xs uppercase tracking-wider font-mono text-sky-400 font-semibold">
              Live Atmosphere
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              {description}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
