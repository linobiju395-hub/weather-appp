import React from 'react';
import { Droplets } from 'lucide-react';
import { DailyItem, WeatherUnit } from '../types/weather';
import { WeatherIcon } from './WeatherIcons';

interface DailyForecastListProps {
  daily: DailyItem[];
  units: WeatherUnit;
}

export const DailyForecastList: React.FC<DailyForecastListProps> = ({ daily }) => {
  if (!daily || daily.length === 0) return null;

  const minGlobal = Math.min(...daily.map((d) => d.tempMin));
  const maxGlobal = Math.max(...daily.map((d) => d.tempMax));
  const rangeGlobal = Math.max(1, maxGlobal - minGlobal);

  return (
    <section className="bg-[#101622] rounded-xl border border-white/[0.06] p-5 shadow-sm">
      <div className="pb-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-slate-100">10-Day Outlook</h2>
        <p className="text-xs text-slate-400 mt-0.5">Extended forecast and precipitation likelihood</p>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {daily.map((day, idx) => {
          const leftPct = Math.max(0, ((day.tempMin - minGlobal) / rangeGlobal) * 100);
          const widthPct = Math.max(10, ((day.tempMax - day.tempMin) / rangeGlobal) * 100);

          return (
            <div
              key={day.date}
              className="py-3 flex items-center justify-between gap-4 text-xs"
            >
              {/* Day Name */}
              <div className="w-24 flex-shrink-0">
                <span className="font-medium text-slate-200 block">
                  {idx === 0 ? 'Today' : day.dayName}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {day.formattedDate}
                </span>
              </div>

              {/* Weather Condition */}
              <div className="w-36 flex items-center gap-2.5 flex-shrink-0">
                <WeatherIcon iconKey={day.iconKey} size={24} animate={false} />
                <span className="text-slate-300 truncate">{day.condition}</span>
              </div>

              {/* Rain Chance */}
              <div className="w-14 flex items-center gap-1 text-[11px] font-mono text-sky-400 flex-shrink-0">
                {day.precipitationProbability > 10 ? (
                  <>
                    <Droplets className="w-3 h-3" />
                    <span>{day.precipitationProbability}%</span>
                  </>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </div>

              {/* Horizontal Bar */}
              <div className="flex-1 flex items-center gap-3">
                <span className="font-mono tabular-nums text-slate-400 w-7 text-right">
                  {day.tempMin}°
                </span>

                <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-slate-400/80"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.min(100 - leftPct, widthPct)}%`
                    }}
                  />
                </div>

                <span className="font-mono tabular-nums font-semibold text-slate-100 w-7 text-left">
                  {day.tempMax}°
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
