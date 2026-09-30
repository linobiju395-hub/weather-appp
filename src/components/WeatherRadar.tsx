import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { RadarLayer } from '../types/weather';

interface WeatherRadarProps {
  cityName: string;
  latitude: number;
  longitude: number;
  condition: string;
  iconKey: string;
}

export const WeatherRadar: React.FC<WeatherRadarProps> = ({
  cityName,
  latitude,
  longitude,
  iconKey
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<RadarLayer>('radar');
  const [frameIndex, setFrameIndex] = useState<number>(3);
  const [zoom, setZoom] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const frames = [
    { label: '-60m', offset: -60 },
    { label: '-30m', offset: -30 },
    { label: '-15m', offset: -15 },
    { label: 'Now', offset: 0 },
    { label: '+30m', offset: 30 },
    { label: '+60m', offset: 60 }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let tick = 0;

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Clean dark map background
      ctx.fillStyle = '#0c111a';
      ctx.fillRect(0, 0, w, h);

      // Range grid circles (hairline, quiet)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      [80, 160, 240].forEach((r) => {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r * zoom, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis lines
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const offset = frames[frameIndex].offset;
      const driftX = (offset / 10) * 9 * zoom;
      const driftY = (offset / 10) * 3 * zoom;

      if (activeLayer === 'radar') {
        const stormIntensity = iconKey.includes('rain') || iconKey.includes('thunderstorm') ? 1.3 : 0.6;
        const cells = [
          { x: w / 2 - 40 * zoom + driftX, y: h / 2 - 20 * zoom + driftY, r: 70 * zoom * stormIntensity, color: 'rgba(56, 189, 248, 0.28)' },
          { x: w / 2 - 35 * zoom + driftX, y: h / 2 - 15 * zoom + driftY, r: 42 * zoom * stormIntensity, color: 'rgba(34, 197, 94, 0.38)' },
          { x: w / 2 - 28 * zoom + driftX, y: h / 2 - 10 * zoom + driftY, r: 22 * zoom * stormIntensity, color: 'rgba(234, 179, 8, 0.5)' }
        ];

        cells.forEach((c) => {
          ctx.beginPath();
          const rad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, c.r);
          rad.addColorStop(0, c.color);
          rad.addColorStop(1, 'transparent');
          ctx.fillStyle = rad;
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Live radar sweep ray
        if (frameIndex === 3) {
          const sweepAngle = (tick * 0.03) % (Math.PI * 2);
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(sweepAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(w * 0.55, 0);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      } else if (activeLayer === 'clouds') {
        const clouds = [
          { x: w / 2 + driftX * 0.6, y: h / 2 - 40 * zoom, r: 100 * zoom },
          { x: w / 2 - 60 * zoom + driftX * 0.6, y: h / 2 + 30 * zoom, r: 110 * zoom }
        ];
        clouds.forEach((cl) => {
          const grad = ctx.createRadialGradient(cl.x, cl.y, 10, cl.x, cl.y, cl.r);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (activeLayer === 'wind') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1;
        const step = 45 * zoom;
        for (let x = 30; x < w; x += step) {
          for (let y = 30; y < h; y += step) {
            const angle = Math.sin((x + tick * 1.5) * 0.01) * 0.3 + 0.2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * 14 * zoom, y + Math.sin(angle) * 14 * zoom);
            ctx.stroke();
          }
        }
      }

      // Location center pin
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [activeLayer, frameIndex, zoom, iconKey]);

  return (
    <section className="bg-[#101622] rounded-xl border border-white/[0.06] overflow-hidden shadow-sm">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">Precipitation Radar</h2>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">
              {latitude.toFixed(2)}°, {longitude.toFixed(2)}°
            </span>
          </div>
        </div>

        {/* Layer tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg">
          {(['radar', 'clouds', 'wind'] as RadarLayer[]).map((l) => (
            <button
              key={l}
              onClick={() => setActiveLayer(l)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                activeLayer === l
                  ? 'bg-white/[0.12] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {l === 'radar' ? 'Precipitation' : l}
            </button>
          ))}
        </div>
      </div>

      {/* Radar Canvas */}
      <div className="relative aspect-[16/9] w-full min-h-[280px] max-h-[380px] bg-[#0c111a] flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full object-cover"
        />

        {/* Location tag */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#0b0f17]/90 border border-white/10 text-xs text-slate-300">
          {cityName}
        </div>

        {/* Current frame badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#0b0f17]/90 border border-white/10 text-xs font-mono text-slate-300">
          {frames[frameIndex].label}
        </div>

        {/* Controls */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
            aria-label="Zoom in"
            className="p-1.5 rounded bg-[#0b0f17]/90 border border-white/10 text-slate-300 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            aria-label="Zoom out"
            className="p-1.5 rounded bg-[#0b0f17]/90 border border-white/10 text-slate-300 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            aria-label="Reset zoom"
            className="p-1.5 rounded bg-[#0b0f17]/90 border border-white/10 text-slate-300 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Playback Scrubbing Bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-t border-white/[0.06] bg-[#0d121c]">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="flex-1 grid grid-cols-6 gap-1">
          {frames.map((f, i) => (
            <button
              key={f.label}
              onClick={() => {
                setIsPlaying(false);
                setFrameIndex(i);
              }}
              className={`py-1 text-center rounded text-xs font-mono transition-colors ${
                frameIndex === i
                  ? 'bg-white/[0.14] text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
