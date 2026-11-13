import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  /** Piksel ölçüsü */
  size?: number;
  className?: string;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 40, className = '' }) => {
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.38) };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`rounded-[10px] object-cover shrink-0 ${className}`}
      />
    );
  }
  return (
    <span
      style={style}
      aria-label={name}
      className={`rounded-[10px] shrink-0 flex items-center justify-center font-bold bg-brand-soft dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/60 text-brand-fg ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
};
