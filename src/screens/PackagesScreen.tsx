import React, { useState } from 'react';
import { Check, Minus } from 'lucide-react';
import type { ScreenType } from '../types';
import { Accordion } from '../components/Accordion';
import type { AccordionItem } from '../components/Accordion';
import { PACKAGES, PACKAGE_FAQ } from '../data/community';
import type { PackageInfo } from '../data/community';

interface PackagesScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

const YEARLY_DISCOUNT = 0.2;

export const PackagesScreen: React.FC<PackagesScreenProps> = ({ onSelectScreen }) => {
  const [yearly, setYearly] = useState(false);

  const priceLabel = (pkg: PackageInfo) => {
    if (pkg.monthlyPrice === null) return 'Fərdi qiymət';
    if (pkg.monthlyPrice === 0) return '0 AZN';
    const value = yearly ? pkg.monthlyPrice * (1 - YEARLY_DISCOUNT) : pkg.monthlyPrice;
    return `${value.toFixed(2).replace('.', ',')} AZN / ay`;
  };

  const onCta = (pkg: PackageInfo) => onSelectScreen(pkg.id === 'school' ? 'contact' : 'register');

  const items: AccordionItem[] = PACKAGES.map((pkg) => ({
    id: pkg.id,
    header: (
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pr-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-extrabold text-ink dark:text-white">{pkg.name}</span>
            {pkg.badge && (
              <span className="btn-gold text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-none">
                {pkg.badge}
              </span>
            )}
          </div>
          <span className="text-sm text-stone-500 dark:text-stone-400">{pkg.tagline}</span>
        </div>
        <span className="text-lg font-extrabold text-brand-fg">{priceLabel(pkg)}</span>
      </div>
    ),
    content: (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <ul className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {pkg.features.map((f) => (
            <li
              key={f.text}
              className={`flex items-start gap-2.5 text-sm ${f.included ? 'text-ink dark:text-paper' : 'text-stone-400 dark:text-stone-500'}`}
            >
              {f.included ? (
                <Check
                  className="w-4 h-4 mt-0.5 shrink-0 text-sage-600 dark:text-sage-300"
                  strokeWidth={2.5}
                />
              ) : (
                <Minus className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span
                className={
                  f.included ? '' : 'line-through decoration-stone-300 dark:decoration-stone-600'
                }
              >
                {f.text}
              </span>
            </li>
          ))}
        </ul>
        <div className="md:col-span-4">
          <button
            onClick={() => onCta(pkg)}
            className={`w-full h-12 rounded-[12px] font-bold text-sm transition-colors ${
              pkg.id === 'premium'
                ? 'btn-gold'
                : 'bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white font-semibold'
            }`}
          >
            {pkg.cta}
          </button>
        </div>
      </div>
    ),
  }));

  const faqItems: AccordionItem[] = PACKAGE_FAQ.map((f, i) => ({
    id: `faq-${i}`,
    header: <span className="font-semibold text-ink dark:text-white">{f.q}</span>,
    content: <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{f.a}</p>,
  }));

  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[900px] mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
            Paketlər
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Sənə uyğun paketi seç. İstənilən vaxt dəyişə bilərsən.
          </p>
          <div
            role="group"
            aria-label="Ödəniş dövrü"
            className="inline-flex rounded-full border border-stone-200 dark:border-stone-800 bg-surface dark:bg-surface-dark p-1"
          >
            {[
              { v: false, label: 'Aylıq' },
              { v: true, label: 'İllik (−20%)' },
            ].map((o) => (
              <button
                key={o.label}
                aria-pressed={yearly === o.v}
                onClick={() => setYearly(o.v)}
                className={`h-9 px-5 rounded-full text-sm font-semibold transition-colors ${
                  yearly === o.v
                    ? 'bg-brand text-white dark:bg-brand-400 dark:text-ink'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <Accordion items={items} defaultOpenId="premium" />

        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold text-ink dark:text-white">
            Tez-tez verilən suallar
          </h2>
          <Accordion items={faqItems} />
        </section>
      </div>
    </div>
  );
};
