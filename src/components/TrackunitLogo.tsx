import React from 'react';

interface TrackunitLogoProps {
  variant?: 'red' | 'white' | 'dark' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  subtitle?: string;
}

export const TrackunitLogo: React.FC<TrackunitLogoProps> = ({
  variant = 'red',
  size = 'md',
  showWordmark = true,
  className = '',
  subtitle
}) => {
  // Trackunit Corporate Color Palette
  // Corporate Red: #8A212B, RGB(138, 33, 43)
  const colors = {
    red: {
      markFill: '#8A212B',
      markAccent: '#B92D3B',
      text: '#111827',
      textHighlight: '#8A212B',
      sub: '#64748B'
    },
    white: {
      markFill: '#FFFFFF',
      markAccent: '#E2E8F0',
      text: '#FFFFFF',
      textHighlight: '#FCA5A5',
      sub: '#94A3B8'
    },
    dark: {
      markFill: '#0F172A',
      markAccent: '#334155',
      text: '#0F172A',
      textHighlight: '#8A212B',
      sub: '#64748B'
    },
    monochrome: {
      markFill: 'currentColor',
      markAccent: 'currentColor',
      text: 'currentColor',
      textHighlight: 'currentColor',
      sub: 'currentColor'
    }
  }[variant];

  const sizeConfig = {
    sm: { height: 22, markSize: 20, fontSize: 13, gap: 'gap-2' },
    md: { height: 28, markSize: 26, fontSize: 16, gap: 'gap-2.5' },
    lg: { height: 36, markSize: 32, fontSize: 20, gap: 'gap-3' },
    xl: { height: 44, markSize: 40, fontSize: 24, gap: 'gap-3.5' }
  }[size];

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} select-none ${className}`}>
      {/* Trackunit Precision Hexagonal Telemetry Glyph */}
      <svg
        width={sizeConfig.markSize}
        height={sizeConfig.markSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        {/* Outer Hexagon */}
        <polygon
          points="50,4 93,27 93,73 50,96 7,73 7,27"
          fill={variant === 'red' ? '#8A212B' : colors.markFill}
          stroke={variant === 'red' ? '#6B1922' : 'none'}
          strokeWidth="2"
        />

        {/* Inner Stylized Geometric T & Connected Nodes */}
        {/* Horizontal Crossbar of T */}
        <rect x="24" y="24" width="52" height="12" rx="4" fill="#FFFFFF" />
        
        {/* Vertical Stem of T */}
        <rect x="44" y="32" width="12" height="42" rx="3" fill="#FFFFFF" />
        
        {/* Left Telemetry Sensor Node */}
        <circle cx="28" cy="62" r="5.5" fill="#FFFFFF" opacity="0.9" />
        <line x1="28" y1="36" x2="28" y2="60" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="3 3" opacity="0.75" />

        {/* Right Telemetry Sensor Node */}
        <circle cx="72" cy="62" r="5.5" fill="#FFFFFF" opacity="0.9" />
        <line x1="72" y1="36" x2="72" y2="60" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="3 3" opacity="0.75" />

        {/* Central Core Status Dot */}
        <circle cx="50" cy="80" r="3.5" fill="#FFFFFF" />
      </svg>

      {/* Trackunit Wordmark and Optional Subtitle */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tighter font-extrabold font-sans">
            <span 
              style={{ fontSize: `${sizeConfig.fontSize}px`, color: colors.text }}
              className="tracking-[0.08em] uppercase font-black"
            >
              TRACKUNIT
            </span>
          </div>
          {subtitle && (
            <span 
              style={{ color: colors.sub }}
              className="text-[9px] font-mono uppercase tracking-widest font-semibold mt-0.5"
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
