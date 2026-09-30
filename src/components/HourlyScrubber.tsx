import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { HourlyItem, WeatherUnit } from '../types/weather';
import { WeatherIcon } from './WeatherIcons';

interface HourlyScrubberProps {
  hourly: HourlyItem[];
  units: WeatherUnit;
}

export const HourlyScrubber: React.FC<HourlyScrubberProps> = ({ hourly, units }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (delta: number) => {
    containerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (!hourly || hourly.length === 0) return null;

  return (
    <section className="bg-[#101622] rounded-xl border border-white/[0.06] p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Hourly Forecast</h2>
          <p className="text-xs text-slate-400 mt-0.5">Next 24 hours</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleScroll(-240)}
            aria-label="Previous hours"
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll(240)}
            aria-label="Next hours"
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto thin-scrollbar pt-4 pb-1"
      >
        {hourly.map((h, idx) => {
          const isNow = idx === 0;
          return (
            <div
              key={h.time}
              className={`flex-shrink-0 w-20 py-3 px-2 rounded-lg flex flex-col items-center justify-between text-center transition-colors ${
                isNow
                  ? 'bg-white/[0.08] text-white'
                  : 'hover:bg-white/[0.03] text-slate-300'
              }`}
            >
              <span className="text-xs font-medium text-slate-400">
                {isNow ? 'Now' : h.formattedTime}
              </span>

              <div className="my-2.5">
                <WeatherIcon iconKey={h.iconKey} size={28} animate={true} />
              </div>

              <span className="text-sm font-semibold font-mono tabular-nums text-slate-100">
                {h.temperature}°
              </span>

              <div className="mt-2 flex items-center gap-1 text-[11px] font-mono text-sky-400">
                {h.precipitationProbability > 0 ? (
                  <>
                    <Droplets className="w-2.5 h-2.5" />
                    <span>{h.precipitationProbability}%</span>
                  </>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
