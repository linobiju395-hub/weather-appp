import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Trash2, Navigation, X, Loader2 } from 'lucide-react';
import { LocationData, SavedCity } from '../types/weather';
import { searchGeocode } from '../services/weatherService';

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: LocationData) => void;
  savedCities: SavedCity[];
  onToggleSaveCity: (city: LocationData) => void;
  onUseCurrentLocation: () => void;
  currentCityName: string;
}

const POPULAR_LOCATIONS: LocationData[] = [
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
  { name: 'Zurich', country: 'Switzerland', latitude: 47.3769, longitude: 8.5417 }
];

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
  savedCities,
  onToggleSaveCity,
  onUseCurrentLocation,
  currentCityName
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchGeocode(query);
      setResults(res);
      setIsSearching(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-white/10 bg-[#101622] text-slate-100 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <h2 className="text-base font-semibold text-slate-100">Select Location</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="p-4 border-b border-white/[0.06] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city, region, or country..."
              autoFocus
              className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#0b0f17] border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-400"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
            )}
          </div>

          <button
            onClick={() => {
              onUseCurrentLocation();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400 rotate-45" />
            <span>Use Current Location</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 space-y-5 text-xs">
          {results.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
                Results
              </span>
              {results.map((r, i) => (
                <button
                  key={`${r.latitude}-${r.longitude}-${i}`}
                  onClick={() => {
                    onSelectCity(r);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.05] text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="font-medium text-slate-200 block">{r.name}</span>
                      <span className="text-slate-400 text-[11px]">
                        {[r.admin1, r.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          )}

          {savedCities.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
                Saved Locations
              </span>
              {savedCities.map((c) => (
                <div
                  key={`${c.latitude}-${c.longitude}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <button
                    onClick={() => {
                      onSelectCity(c);
                      onClose();
                    }}
                    className="flex-1 flex items-center gap-2.5 text-left"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <div>
                      <span className="font-medium text-slate-200 block">{c.name}</span>
                      <span className="text-slate-400 text-[11px]">{c.country}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2.5">
                    {c.lastTemp !== undefined && (
                      <span className="font-mono font-medium text-slate-200">{c.lastTemp}°</span>
                    )}
                    <button
                      onClick={() => onToggleSaveCity(c)}
                      aria-label="Remove"
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
              Popular Cities
            </span>
            <div className="grid grid-cols-3 gap-2">
              {POPULAR_LOCATIONS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    onSelectCity(c);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] text-left transition-colors border border-white/[0.04]"
                >
                  <span className="font-medium text-slate-200 block">{c.name}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{c.country}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
