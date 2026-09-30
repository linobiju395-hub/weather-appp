import React, { useState, useEffect, useRef } from 'react';

interface WeatherSkyBackgroundProps {
  iconKey: string;
  isDay: number;
}

export const WeatherSkyBackground: React.FC<WeatherSkyBackgroundProps> = ({
  iconKey,
  isDay
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const isRain = iconKey.includes('rain') || iconKey.includes('thunderstorm') || iconKey === 'sleet';
    const isThunder = iconKey.includes('thunderstorm');
    const isSnow = iconKey.includes('snow');
    const isCloudy = iconKey.includes('cloud') || iconKey === 'fog';
    const isSunny = iconKey === 'sunny' && isDay === 1;

    // RAINDROPS
    const rainCount = isThunder ? 180 : isRain ? 120 : 0;
    const raindrops = Array.from({ length: rainCount }, () => ({
      x: Math.random() * (w + 100),
      y: Math.random() * h,
      speed: 18 + Math.random() * 10,
      len: 16 + Math.random() * 14,
      opacity: 0.35 + Math.random() * 0.4
    }));

    // SNOWFLAKES
    const snowCount = isSnow ? 100 : 0;
    const snowflakes = Array.from({ length: snowCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 1.5 + Math.random() * 3,
      speedY: 1 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * 1.5,
      swing: Math.random() * Math.PI * 2,
      opacity: 0.4 + Math.random() * 0.6
    }));

    // DRIFTING CLOUDS
    const cloudCount = isCloudy || isRain || isThunder ? 7 : 0;
    const clouds = Array.from({ length: cloudCount }, (_, i) => ({
      x: (w / (cloudCount || 1)) * i + Math.random() * 50,
      y: 30 + Math.random() * (h * 0.45),
      rx: 160 + Math.random() * 180,
      ry: 55 + Math.random() * 65,
      speed: 0.2 + Math.random() * 0.3,
      opacity: isDay ? 0.25 + Math.random() * 0.2 : 0.15 + Math.random() * 0.15
    }));

    // SUNNY DUST PARTICLES
    const sunCount = isSunny ? 35 : 0;
    const sunMotes = Array.from({ length: sunCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.5 + Math.random() * 3,
      speedY: -0.3 - Math.random() * 0.4,
      speedX: (Math.random() - 0.5) * 0.5,
      opacity: 0.3 + Math.random() * 0.5,
      pulse: Math.random() * Math.PI * 2
    }));

    // LIGHTNING
    let lightningTimer = 0;
    let lightningFlash = 0;

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, w, h);

      // SUNNY: Radiant Golden Shimmer & Beams
      if (isSunny) {
        ctx.save();
        const sunX = w * 0.82;
        const sunY = -20;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, Math.min(w, h) * 0.9);
        sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        sunGlow.addColorStop(0.3, 'rgba(251, 191, 36, 0.25)');
        sunGlow.addColorStop(0.7, 'rgba(245, 158, 11, 0.08)');
        sunGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, w, h);

        // Rotating rays
        ctx.translate(sunX, sunY);
        for (let i = 0; i < 12; i++) {
          const angle = tick * 0.0018 + (i * Math.PI * 2) / 12;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, w * 0.9, angle - 0.08, angle + 0.08);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.fill();
        }
        ctx.restore();

        // Motes
        ctx.save();
        for (const m of sunMotes) {
          m.pulse += 0.03;
          m.y += m.speedY;
          m.x += m.speedX;
          if (m.y < -10) m.y = h + 10;
          if (m.x < 0) m.x = w;
          if (m.x > w) m.x = 0;
          const op = m.opacity * (0.6 + Math.sin(m.pulse) * 0.4);
          ctx.beginPath();
          ctx.fillStyle = `rgba(254, 240, 138, ${op})`;
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // THUNDERSTORM: Electric flash
      if (isThunder) {
        lightningTimer++;
        if (lightningTimer > 100 && Math.random() < 0.03) {
          lightningFlash = 0.6;
          lightningTimer = 0;
        }
        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(240, 249, 255, ${lightningFlash})`;
          ctx.fillRect(0, 0, w, h);
          lightningFlash *= 0.82;
          if (lightningFlash < 0.01) lightningFlash = 0;
        }
      }

      // DRIFTING VOLUMETRIC CLOUDS
      if (cloudCount > 0) {
        ctx.save();
        for (const cl of clouds) {
          cl.x += cl.speed;
          if (cl.x - cl.rx > w) {
            cl.x = -cl.rx;
            cl.y = 20 + Math.random() * (h * 0.45);
          }
          ctx.beginPath();
          ctx.ellipse(cl.x, cl.y, cl.rx, cl.ry, 0, 0, Math.PI * 2);
          const cGrad = ctx.createRadialGradient(cl.x, cl.y, 10, cl.x, cl.y, cl.rx);
          if (isThunder) {
            cGrad.addColorStop(0, `rgba(71, 85, 105, ${cl.opacity * 1.4})`);
            cGrad.addColorStop(1, 'transparent');
          } else if (isRain) {
            cGrad.addColorStop(0, `rgba(148, 163, 184, ${cl.opacity * 1.2})`);
            cGrad.addColorStop(1, 'transparent');
          } else {
            cGrad.addColorStop(0, `rgba(255, 255, 255, ${cl.opacity})`);
            cGrad.addColorStop(1, 'transparent');
          }
          ctx.fillStyle = cGrad;
          ctx.fill();
        }
        ctx.restore();
      }

      // FALLING RAIN
      if (isRain) {
        ctx.save();
        ctx.lineWidth = isThunder ? 2 : 1.5;
        for (const d of raindrops) {
          d.y += d.speed;
          d.x -= d.speed * 0.2;
          if (d.y > h) {
            d.y = -d.len - 20;
            d.x = Math.random() * (w + 150);
          }
          ctx.beginPath();
          ctx.strokeStyle = `rgba(224, 242, 254, ${d.opacity})`;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * 0.2, d.y + d.len);
          ctx.stroke();
        }
        ctx.restore();
      }

      // SWIRLING SNOW
      if (isSnow) {
        ctx.save();
        for (const s of snowflakes) {
          s.swing += 0.025;
          s.y += s.speedY;
          s.x += Math.sin(s.swing) * s.speedX * 2;
          if (s.y > h) {
            s.y = -10;
            s.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [iconKey, isDay]);

  // Determine beautiful natural sky gradient
  let skyGradient = 'from-[#3a88e9] via-[#4f98f2] to-[#7db6f8]'; // Default daytime blue sky

  if (!isDay) {
    // Night Sky
    skyGradient = 'from-[#080d1a] via-[#101a33] to-[#18284d]';
  } else if (iconKey.includes('thunderstorm')) {
    // Severe Thunderstorm Sky
    skyGradient = 'from-[#1e293b] via-[#334155] to-[#475569]';
  } else if (iconKey.includes('rain')) {
    // Overcast Rainy Sky
    skyGradient = 'from-[#3b526d] via-[#527192] to-[#6d8fae]';
  } else if (iconKey.includes('snow')) {
    // Snowy Winter Sky
    skyGradient = 'from-[#546e7a] via-[#78909c] to-[#b0bec5]';
  } else if (iconKey.includes('cloud')) {
    // Partly Cloudy / Overcast Sky
    skyGradient = 'from-[#427fc7] via-[#5c97dc] to-[#8ebcf2]';
  } else if (iconKey === 'sunny') {
    // Bright Mediterranean Azure Sky
    skyGradient = 'from-[#2563eb] via-[#3b82f6] to-[#60a5fa]';
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b ${skyGradient} transition-all duration-1000 overflow-hidden`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};
