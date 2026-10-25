import React from 'react';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  color = '#2563EB',
  trackColor = '#E2E8F0',
  label,
  sublabel,
  showPercent = true,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="transition-colors duration-200"
        />
        {/* Animated Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Central Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none px-2">
        {showPercent && (
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {clampedProgress}%
          </span>
        )}
        {label && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
