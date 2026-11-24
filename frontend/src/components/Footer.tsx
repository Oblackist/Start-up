import React from 'react';
import { Link } from '../lib/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { ScreenType } from '../types';
import { SCREEN_PATHS } from '../routes';
import { BrandLogo } from './BrandLogo';

/** Əlaqə məlumatları nümunədir: real məlumatla əvəz edin */
export const CONTACT_INFO = {
  email: 'info@careerarena.az',
  phone: '+994 12 000 00 00',
  address: 'Bakı, Azərbaycan',
};

const COLUMNS: { title: string; links: { screen: ScreenType; label: string }[] }[] = [
  {
    title: 'Platforma',
    links: [
      { screen: 'subjects', label: 'Fənlər' },
      { screen: 'ranking', label: 'Reytinq' },
      { screen: 'packages', label: 'Paketlər' },
      { screen: 'dashboard', label: 'İnkişaf paneli' },
      { screen: 'practice', label: 'Fərdi məşq' },
    ],
  },
  {
    title: 'Şirkət',
    links: [
      { screen: 'about', label: 'Haqqımızda' },
      { screen: 'contact', label: 'Əlaqə' },
      { screen: 'packages', label: 'Məktəb və kurslar üçün' },
    ],
  },
  {
    title: 'Hüquqi',
    links: [
      { screen: 'privacy', label: 'Məxfilik siyasəti' },
      { screen: 'terms', label: 'İstifadə şərtləri' },
    ],
  },
];

export const Footer: React.FC = () => (
  <footer className="bg-surface dark:bg-ink-deep text-stone-600 dark:text-stone-400 border-t border-stone-200 dark:border-stone-800/80 text-sm">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
      <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-10">
        <div className="col-span-2 md:col-span-5 space-y-5">
          <Link to={SCREEN_PATHS.landing} className="inline-flex items-center gap-3">
            <BrandLogo className="w-14 h-10" />
            <span className="text-lg font-bold text-ink dark:text-white tracking-tight">Career Arena</span>
          </Link>
          <p className="max-w-sm leading-relaxed">
            9–11-ci sinif şagirdləri üçün buraxılış imtahanlarına hazırlıq platforması: mövzu üzrə
            analiz, aydın izahlar və fərdi məşq planı.
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand dark:text-gold shrink-0" />
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="hover:text-brand dark:hover:text-white transition-colors"
              >
                {CONTACT_INFO.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-brand dark:text-gold shrink-0" />
              <a
                href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`}
                className="hover:text-brand dark:hover:text-white transition-colors"
              >
                {CONTACT_INFO.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-brand dark:text-gold shrink-0" />
              <span>{CONTACT_INFO.address}</span>
            </li>
          </ul>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-stone-200">
              {col.title}
            </h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={SCREEN_PATHS[link.screen]}
                    className="hover:text-brand dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-stone-200 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span>© 2026 Career Arena. Bütün hüquqlar qorunur.</span>
        <span className="flex items-center gap-4">
          <Link to={SCREEN_PATHS.privacy} className="hover:text-brand dark:hover:text-white transition-colors">
            Məxfilik
          </Link>
          <Link to={SCREEN_PATHS.terms} className="hover:text-brand dark:hover:text-white transition-colors">
            Şərtlər
          </Link>
          <span className="text-stone-400 dark:text-stone-500">Exam Arena modulu</span>
        </span>
      </div>
    </div>
  </footer>
);
