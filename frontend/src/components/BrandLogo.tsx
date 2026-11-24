import React from 'react';

/**
 * Logonu dəyişmək üçün faylı `src/assets/logo.png` (və ya .svg / .webp / .jpg) adı ilə qoymaq kifayətdir.
 * Fayl tapılmasa, müvəqqəti "CA" işarəsi göstərilir.
 */
const logos = import.meta.glob('../assets/logo.{svg,png,webp,jpg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const logoSrc = Object.values(logos)[0];

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-14 h-10' }) =>
  logoSrc ? (
    <img src={logoSrc} alt="Career Arena" className={`${className} object-contain`} />
  ) : (
    <div
      className={`${className} rounded-[12px] bg-brand text-white flex items-center justify-center font-bold text-lg shadow-sm`}
    >
      CA
    </div>
  );
