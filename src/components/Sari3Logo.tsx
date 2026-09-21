import React from 'react';

interface Sari3LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
}

export const Sari3Logo: React.FC<Sari3LogoProps> = ({
  size = 'md',
  showTagline = false,
  taglineText,
  className = '',
}) => {
  const iconDimensions = {
    sm: { width: 34, height: 34, text: 'text-xl', badge: 'text-[9px]' },
    md: { width: 46, height: 46, text: 'text-2xl', badge: 'text-[10px]' },
    lg: { width: 68, height: 68, text: 'text-4xl', badge: 'text-xs' },
    xl: { width: 92, height: 92, text: 'text-5xl', badge: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Fidelity Aerodynamic Motorcycle Courier Vector Icon */}
      <div className="relative flex-shrink-0">
        <svg
          width={iconDimensions.width}
          height={iconDimensions.height}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          {/* Speed Wind Streaks */}
          <path
            d="M8 38H32M4 48H26M10 60H34M14 72H28"
            stroke="#00D589"
            strokeWidth="4"
            strokeLinecap="round"
            className="opacity-80"
          />
          <path
            d="M18 42H38M12 54H30"
            stroke="#10B981"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="opacity-60"
          />

          {/* Delivery Box with Location Pin on courier back */}
          <rect
            x="34"
            y="26"
            width="28"
            height="28"
            rx="6"
            fill="#00D589"
            transform="rotate(-12 34 26)"
          />
          {/* Pin inside delivery box */}
          <circle cx="48" cy="38" r="4" fill="#0F172A" />
          <path
            d="M48 38L48 46"
            stroke="#0F172A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Courier Helmet & Visor */}
          <circle cx="84" cy="30" r="14" fill="#00D589" />
          {/* Dark aerodynamically curved visor */}
          <path
            d="M84 26C88 26 94 29 96 34C96 35 91 37 84 37C82 37 81 36 81 34C81 29 82 26 84 26Z"
            fill="#0F172A"
          />

          {/* Leaning Rider Body & Arms */}
          <path
            d="M62 46C65 40 76 34 84 38C82 46 75 52 66 54L62 46Z"
            fill="#1E293B"
          />
          <path
            d="M68 48L90 52L86 58L66 54Z"
            fill="#00D589"
          />

          {/* Motorcycle Body Frame & Fairing */}
          <path
            d="M42 66C52 60 76 56 94 48L106 58C96 66 70 74 44 76L42 66Z"
            fill="#0F172A"
          />
          {/* Headlight glow */}
          <path
            d="M104 54L112 57L107 62Z"
            fill="#00E599"
          />

          {/* Rear Wheel */}
          <circle cx="40" cy="84" r="22" stroke="#0F172A" strokeWidth="8" />
          <circle cx="40" cy="84" r="14" stroke="#00D589" strokeWidth="3" />
          <circle cx="40" cy="84" r="6" fill="#1E293B" />

          {/* Front Wheel */}
          <circle cx="98" cy="76" r="20" stroke="#0F172A" strokeWidth="8" />
          <circle cx="98" cy="76" r="12" stroke="#00D589" strokeWidth="3" />
          <circle cx="98" cy="76" r="5" fill="#1E293B" />

          {/* Front Fork Suspension */}
          <path
            d="M88 54L98 76"
            stroke="#8B5CF6"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography: Stretched, Sleek & Eye-friendly */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline gap-1">
          {/* Stretched aerodynamic brand text */}
          <span
            className={`font-sari3-stretched font-black italic tracking-wide ${iconDimensions.text} text-emerald-500 dark:text-emerald-400 drop-shadow-sm`}
            style={{
              textShadow: '0 2px 8px rgba(0, 213, 137, 0.25)',
              letterSpacing: '0.04em',
            }}
          >
            sari<span className="text-purple-500 dark:text-purple-400 font-extrabold">3</span>
          </span>

          {/* Arabic speed mark pill */}
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] font-['Cairo'] tracking-tight">
            سريع
          </span>
        </div>

        {showTagline && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">
            {taglineText || 'توصيل فوري • تفاوض عادل'}
          </p>
        )}
      </div>
    </div>
  );
};
