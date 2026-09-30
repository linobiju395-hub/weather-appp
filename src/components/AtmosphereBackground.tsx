import React, { useEffect, useRef } from 'react';

interface AtmosphereBackgroundProps {
  iconKey: string;
  isDay: number;
  condition: string;
}

export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({
  iconKey,
  isDay,
  condition
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

    const isRain = iconKey.includes('rain') || iconKey.includes('thunderstorm') || condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle');
    const isSnow = iconKey.includes('snow') || iconKey.includes('sleet') || condition.toLowerCase().includes('snow');
    const isThunder = iconKey.includes('thunderstorm') || condition.toLowerCase().includes('thunder');
    const isCloudy = iconKey.includes('cloud') || condition.toLowerCase().includes('cloud') || condition.toLowerCase().includes('overcast');
    const isSunny = (iconKey === 'sunny' || condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('sun')) && isDay === 1;
    const isNightClear = !isDay && (iconKey === 'clear-night' || condition.toLowerCase().includes('clear'));

    // 1. Rain setup
    const rainCount = isThunder ? 180 : isRain ? 120 : 0;
    const raindrops = Array.from({ length: rainCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      length: 16 + Math.random() * 16,
      speed: 18 + Math.random() * 10,
      opacity: 0.2 + Math.random() * 0.45,
      splashRadius: 0
    }));

    // Rain splashes on bottom of screen
    interface Splash {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;
    }
    const splashes: Splash[] = [];

    // 2. Snow setup
    const snowCount = isSnow ? 100 : 0;
    const snowflakes = Array.from({ length: snowCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 1.5 + Math.random() * 3,
      speedY: 1.2 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * 1.2,
      swing: Math.random() * Math.PI * 2,
      opacity: 0.3 + Math.random() * 0.6
    }));

    // 3. Clouds drifting setup (for cloudy, overcast, or partly cloudy)
    const cloudCount = isCloudy ? 6 : 0;
    const clouds = Array.from({ length: cloudCount }, (_, i) => ({
      x: (w / cloudCount) * i + Math.random() * 100,
      y: 40 + Math.random() * (h * 0.4),
      radiusX: 140 + Math.random() * 160,
      radiusY: 50 + Math.random() * 60,
      speed: 0.15 + Math.random() * 0.25,
      opacity: 0.08 + Math.random() * 0.12
    }));

    // 4. Sunny floating warm dust motes
    const sunnyMoteCount = isSunny ? 35 : isNightClear ? 50 : 0;
    const motes = Array.from({ length: sunnyMoteCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: isNightClear ? 0.8 + Math.random() * 1.5 : 1.5 + Math.random() * 2.5,
      speedY: isNightClear ? (Math.random() - 0.5) * 0.1 : -0.3 - Math.random() * 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: 0.2 + Math.random() * 0.5,
      pulse: Math.random() * Math.PI * 2
    }));

    // Lightning flash states
    let lightningTimer = 0;
    let lightningFlash = 0;

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, w, h);

      // SUNNY: Ambient radiant sunbeams from top-right
      if (isSunny) {
        ctx.save();
        const sunX = w * 0.75;
        const sunY = -40;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, Math.min(w, h) * 0.8);
        sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
        sunGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.06)');
        sunGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.02)');
        sunGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, w, h);

        // Rotating soft solar ray fans
        const rayCount = 8;
        ctx.translate(sunX, sunY);
        for (let i = 0; i < rayCount; i++) {
          const angle = (tick * 0.002) + (i * Math.PI * 2) / rayCount;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, w * 0.9, angle - 0.12, angle + 0.12);
          ctx.closePath();
          ctx.fillStyle = 'rgba(254, 240, 138, 0.018)';
          ctx.fill();
        }
        ctx.restore();
      }

      // NIGHT: Deep starlight backdrop
      if (isNightClear) {
        ctx.save();
        const moonX = w * 0.8;
        const moonY = 80;
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 280);
        moonGlow.addColorStop(0, 'rgba(186, 230, 253, 0.1)');
        moonGlow.addColorStop(0.5, 'rgba(147, 197, 253, 0.03)');
        moonGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = moonGlow;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // THUNDERSTORM: Electric flash
      if (isThunder) {
        lightningTimer++;
        if (lightningTimer > 120 && Math.random() < 0.025) {
          lightningFlash = 0.55;
          lightningTimer = 0;
        }
        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlash})`;
          ctx.fillRect(0, 0, w, h);
          lightningFlash *= 0.82;
          if (lightningFlash < 0.01) lightningFlash = 0;
        }
      }

      // CLOUDY: Drifting volumetric atmospheric cloud tiers
      if (isCloudy) {
        ctx.save();
        for (const cl of clouds) {
          cl.x += cl.speed;
          if (cl.x - cl.radiusX > w) {
            cl.x = -cl.radiusX;
            cl.y = 30 + Math.random() * (h * 0.4);
          }
          ctx.beginPath();
          ctx.ellipse(cl.x, cl.y, cl.radiusX, cl.radiusY, 0, 0, Math.PI * 2);
          const cGrad = ctx.createRadialGradient(cl.x, cl.y, 20, cl.x, cl.y, cl.radiusX);
          cGrad.addColorStop(0, `rgba(148, 163, 184, ${cl.opacity * 1.2})`);
          cGrad.addColorStop(0.6, `rgba(100, 116, 139, ${cl.opacity * 0.6})`);
          cGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = cGrad;
          ctx.fill();
        }
        ctx.restore();
      }

      // RAIN: Animated Falling Raindrops & Ground Splashes
      if (isRain) {
        ctx.save();
        ctx.lineWidth = isThunder ? 1.6 : 1.2;

        for (const drop of raindrops) {
          drop.y += drop.speed;
          drop.x -= drop.speed * 0.15; // wind slant

          if (drop.y > h - 10) {
            // Spawn ground splash
            if (splashes.length < 35 && Math.random() < 0.4) {
              splashes.push({
                x: drop.x,
                y: h - Math.random() * 20,
                radius: 1,
                maxRadius: 6 + Math.random() * 8,
                opacity: 0.4
              });
            }
            drop.y = -drop.length - Math.random() * 20;
            drop.x = Math.random() * (w + 100);
          }

          ctx.beginPath();
          ctx.strokeStyle = `rgba(125, 211, 252, ${drop.opacity})`;
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.length * 0.15, drop.y + drop.length);
          ctx.stroke();
        }

        // Draw and update splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.radius += 0.8;
          s.opacity *= 0.85;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(186, 230, 253, ${s.opacity})`;
          ctx.ellipse(s.x, s.y, s.radius * 1.6, s.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (s.opacity < 0.02 || s.radius >= s.maxRadius) {
            splashes.splice(i, 1);
          }
        }
        ctx.restore();
      }

      // SNOW: Swirling undulating snowflakes
      if (isSnow) {
        ctx.save();
        for (const flake of snowflakes) {
          flake.swing += 0.02;
          flake.y += flake.speedY;
          flake.x += Math.sin(flake.swing) * flake.speedX * 1.5;

          if (flake.y > h) {
            flake.y = -10;
            flake.x = Math.random() * w;
          }

          ctx.beginPath();
          ctx.fillStyle = `rgba(248, 250, 252, ${flake.opacity})`;
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // SUNNY OR CLEAR NIGHT: Ambient golden motes / twinkling stars
      if (isSunny || isNightClear) {
        ctx.save();
        for (const m of motes) {
          m.pulse += 0.03;
          m.y += m.speedY;
          m.x += m.speedX;

          if (m.y < -10) m.y = h + 10;
          if (m.y > h + 10) m.y = -10;
          if (m.x < 0) m.x = w;
          if (m.x > w) m.x = 0;

          const currentOpacity = m.opacity * (0.6 + Math.sin(m.pulse) * 0.4);
          ctx.beginPath();
          if (isSunny) {
            ctx.fillStyle = `rgba(253, 224, 71, ${currentOpacity * 0.6})`;
          } else {
            ctx.fillStyle = `rgba(226, 232, 240, ${currentOpacity * 0.85})`;
          }
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
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
  }, [iconKey, isDay, condition]);

  // Dynamic atmospheric mood base gradient
  let ambientTheme = 'from-[#0b0f17] via-[#0d131f] to-[#080c14]';
  if (iconKey.includes('thunderstorm') || condition.toLowerCase().includes('thunder')) {
    ambientTheme = 'from-[#0a0f1d] via-[#0d1527] to-[#060a12]';
  } else if (iconKey.includes('rain') || condition.toLowerCase().includes('rain')) {
    ambientTheme = 'from-[#091322] via-[#0c182b] to-[#070d18]';
  } else if (iconKey.includes('snow') || condition.toLowerCase().includes('snow')) {
    ambientTheme = 'from-[#0c1728] via-[#0e1c31] to-[#080e1a]';
  } else if (isDay && (iconKey === 'sunny' || condition.toLowerCase().includes('clear'))) {
    ambientTheme = 'from-[#0d172e] via-[#0f1d3a] to-[#091022]';
  } else if (!isDay) {
    ambientTheme = 'from-[#070b14] via-[#0a101f] to-[#05080f]';
  }

  return (
    <div className={`fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b ${ambientTheme} transition-colors duration-1000 overflow-hidden`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};
