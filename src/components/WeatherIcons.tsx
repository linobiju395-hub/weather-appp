import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const AnimatedSun: React.FC<IconProps> = ({ className = '', size = 56, animate = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Sunny sky"
  >
    <defs>
      <radialGradient id="sunCenterGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="60%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </radialGradient>
      <filter id="sunHaloGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Rotating Radiating Corona Rays */}
    <g className={animate ? 'anim-sun-spin' : ''}>
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
        <line
          key={i}
          x1="32"
          y1="6"
          x2="32"
          y2={i % 2 === 0 ? "13" : "11"}
          stroke="#f59e0b"
          strokeWidth={i % 2 === 0 ? "3" : "2"}
          strokeLinecap="round"
          transform={`rotate(${angle} 32 32)`}
        />
      ))}
    </g>
    {/* Core with gentle breathing pulse */}
    <circle
      cx="32"
      cy="32"
      r="14"
      fill="url(#sunCenterGrad)"
      filter="url(#sunHaloGlow)"
      className={animate ? 'anim-sun-pulse' : ''}
    />
  </svg>
);

export const AnimatedMoon: React.FC<IconProps> = ({ className = '', size = 56, animate = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Clear night"
  >
    <defs>
      <linearGradient id="moonShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="70%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>
    {animate && (
      <>
        <circle cx="16" cy="18" r="1.5" fill="#e2e8f0" className="animate-pulse" />
        <circle cx="48" cy="14" r="1.2" fill="#e2e8f0" className="animate-ping" style={{ animationDuration: '3s' }} />
        <circle cx="44" cy="46" r="1.5" fill="#e2e8f0" className="animate-pulse" style={{ animationDelay: '1s' }} />
      </>
    )}
    <path
      d="M38 16C26.95 16 18 24.95 18 36C18 47.05 26.95 56 38 56C42.86 56 47.33 54.27 50.8 51.38C41.36 49.62 34.25 41.38 34.25 31.5C34.25 24.6 37.86 18.52 43.32 15.11C41.61 15.03 39.82 16 38 16Z"
      fill="url(#moonShine)"
      className={animate ? 'anim-cloud-drift' : ''}
    />
  </svg>
);

export const AnimatedPartlyCloudy: React.FC<IconProps & { isNight?: boolean }> = ({
  className = '',
  size = 56,
  animate = true,
  isNight = false
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Partly cloudy"
  >
    <defs>
      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>

    {/* Peeking Sun or Moon */}
    {!isNight ? (
      <g transform="translate(6, -4)">
        <g className={animate ? 'anim-sun-spin' : ''}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1="34"
              y1="10"
              x2="34"
              y2="15"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${angle} 34 22)`}
            />
          ))}
        </g>
        <circle cx="34" cy="22" r="10" fill="#f59e0b" className={animate ? 'anim-sun-pulse' : ''} />
      </g>
    ) : (
      <path
        d="M40 16C33 16 28 21 28 28C28 35 33 40 40 40C43 40 45.8 38.9 48 37C42 35.8 38 30.7 38 24.5C38 20.2 40.2 16.4 43.7 14.3C42.6 15.5 41.3 16 40 16Z"
        fill="#94a3b8"
      />
    )}

    {/* Drifting Foreground Cloud */}
    <path
      d="M20 48H44C48.42 48 52 44.42 52 40C52 35.8 48.8 32.35 44.7 32.04C43.8 26.3 38.8 22 33 22C28.2 22 24.1 24.9 22.3 29.1C21.6 29.04 20.8 29 20 29C15.58 29 12 32.58 12 37C12 41.42 15.58 48 20 48Z"
      fill="url(#cloudGrad)"
      className={animate ? 'anim-cloud-drift' : ''}
    />
  </svg>
);

export const AnimatedCloudy: React.FC<IconProps> = ({ className = '', size = 56, animate = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Overcast clouds"
  >
    <defs>
      <linearGradient id="cloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <linearGradient id="cloudFore" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>
    {/* Rear dark drifting cloud */}
    <path
      d="M30 40H48C51.3 40 54 37.3 54 34C54 30.8 51.6 28.2 48.5 28C47.8 23.7 44.1 20.5 39.8 20.5C36.2 20.5 33.1 22.7 31.8 25.8C31.2 25.7 30.6 25.7 30 25.7C26.7 25.7 24 28.4 24 31.7C24 35 26.7 40 30 40Z"
      fill="url(#cloudBack)"
      className={animate ? 'anim-cloud-drift-reverse' : ''}
    />
    {/* Foreground fluffy cloud */}
    <path
      d="M18 50H44C48.42 50 52 46.42 52 42C52 37.8 48.8 34.35 44.7 34.04C43.8 28.3 38.8 24 33 24C28.2 24 24.1 26.9 22.3 31.1C21.6 31.04 20.8 31 20 31C15.58 31 12 34.58 12 39C12 43.42 15.58 50 20 50Z"
      fill="url(#cloudFore)"
      className={animate ? 'anim-cloud-drift' : ''}
    />
  </svg>
);

export const AnimatedRain: React.FC<IconProps & { heavy?: boolean }> = ({
  className = '',
  size = 56,
  animate = true,
  heavy = false
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Rain"
  >
    <defs>
      <linearGradient id="rainCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>
    <path
      d="M20 40H44C48.42 40 52 36.42 52 32C52 27.8 48.8 24.35 44.7 24.04C43.8 18.3 38.8 14 33 14C28.2 14 24.1 16.9 22.3 21.1C21.6 21.04 20.8 21 20 21C15.58 21 12 24.58 12 29C12 33.42 15.58 40 20 40Z"
      fill="url(#rainCloudGrad)"
      className={animate ? 'anim-cloud-drift' : ''}
    />
    <g>
      <line
        x1="22"
        y1="44"
        x2="19"
        y2="53"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        className={animate ? 'anim-rain-1' : ''}
      />
      <line
        x1="32"
        y1="44"
        x2="29"
        y2="54"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        className={animate ? 'anim-rain-2' : ''}
      />
      <line
        x1="42"
        y1="44"
        x2="39"
        y2="53"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        className={animate ? 'anim-rain-3' : ''}
      />
      {heavy && (
        <line
          x1="27"
          y1="46"
          x2="24"
          y2="55"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeLinecap="round"
          className={animate ? 'anim-rain-2' : ''}
        />
      )}
    </g>
  </svg>
);

export const AnimatedThunderstorm: React.FC<IconProps & { hail?: boolean }> = ({
  className = '',
  size = 56,
  animate = true,
  hail = false
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Thunderstorm"
  >
    <defs>
      <linearGradient id="stormGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>
    <path
      d="M20 38H44C48.42 38 52 34.42 52 30C52 25.8 48.8 22.35 44.7 22.04C43.8 16.3 38.8 12 33 12C28.2 12 24.1 14.9 22.3 19.1C21.6 19.04 20.8 19 20 19C15.58 19 12 22.58 12 27C12 31.42 15.58 38 20 38Z"
      fill="url(#stormGrad)"
    />
    <path
      d="M32 34L25 46H32L29 58L41 44H34L37 34H32Z"
      fill="#facc15"
      className={animate ? 'anim-lightning' : ''}
    />
    {!hail ? (
      <line
        x1="18"
        y1="44"
        x2="15"
        y2="52"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={animate ? 'anim-rain-1' : ''}
      />
    ) : (
      <circle cx="18" cy="46" r="2.2" fill="#e0f2fe" className={animate ? 'anim-rain-1' : ''} />
    )}
  </svg>
);

export const AnimatedSnow: React.FC<IconProps> = ({ className = '', size = 56, animate = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Snow"
  >
    <defs>
      <linearGradient id="snowCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>
    <path
      d="M20 38H44C48.42 38 52 34.42 52 30C52 25.8 48.8 22.35 44.7 22.04C43.8 16.3 38.8 12 33 12C28.2 12 24.1 14.9 22.3 19.1C21.6 19.04 20.8 19 20 19C15.58 19 12 22.58 12 27C12 31.42 15.58 38 20 38Z"
      fill="url(#snowCloudGrad)"
      className={animate ? 'anim-cloud-drift' : ''}
    />
    <circle cx="22" cy="46" r="2.8" fill="#f8fafc" className={animate ? 'anim-snow-1' : ''} />
    <circle cx="33" cy="48" r="2.8" fill="#f8fafc" className={animate ? 'anim-snow-2' : ''} />
    <circle cx="43" cy="46" r="2.8" fill="#f8fafc" className={animate ? 'anim-snow-3' : ''} />
  </svg>
);

export const AnimatedFog: React.FC<IconProps> = ({ className = '', size = 56, animate = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Fog and mist"
  >
    <line
      x1="12"
      y1="24"
      x2="52"
      y2="24"
      stroke="#94a3b8"
      strokeWidth="3.5"
      strokeLinecap="round"
      className={animate ? 'anim-mist-1' : ''}
    />
    <line
      x1="18"
      y1="34"
      x2="48"
      y2="34"
      stroke="#cbd5e1"
      strokeWidth="3.5"
      strokeLinecap="round"
      className={animate ? 'anim-mist-2' : ''}
    />
    <line
      x1="10"
      y1="44"
      x2="54"
      y2="44"
      stroke="#94a3b8"
      strokeWidth="3.5"
      strokeLinecap="round"
      className={animate ? 'anim-mist-1' : ''}
    />
  </svg>
);

export const WeatherIcon: React.FC<{
  iconKey: string;
  size?: number;
  className?: string;
  animate?: boolean;
}> = ({ iconKey, size = 56, className = '', animate = true }) => {
  switch (iconKey) {
    case 'sunny':
      return <AnimatedSun size={size} className={className} animate={animate} />;
    case 'clear-night':
      return <AnimatedMoon size={size} className={className} animate={animate} />;
    case 'partly-cloudy-day':
      return <AnimatedPartlyCloudy size={size} className={className} animate={animate} isNight={false} />;
    case 'partly-cloudy-night':
      return <AnimatedPartlyCloudy size={size} className={className} animate={animate} isNight={true} />;
    case 'cloudy':
      return <AnimatedCloudy size={size} className={className} animate={animate} />;
    case 'rain-light':
      return <AnimatedRain size={size} className={className} animate={animate} heavy={false} />;
    case 'rain':
    case 'rain-heavy':
      return <AnimatedRain size={size} className={className} animate={animate} heavy={iconKey === 'rain-heavy'} />;
    case 'thunderstorm':
      return <AnimatedThunderstorm size={size} className={className} animate={animate} hail={false} />;
    case 'thunderstorm-hail':
      return <AnimatedThunderstorm size={size} className={className} animate={animate} hail={true} />;
    case 'snow':
    case 'snow-light':
      return <AnimatedSnow size={size} className={className} animate={animate} />;
    case 'fog':
      return <AnimatedFog size={size} className={className} animate={animate} />;
    default:
      return <AnimatedSun size={size} className={className} animate={animate} />;
  }
};
