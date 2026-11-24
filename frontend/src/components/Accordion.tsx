import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  header: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}

/** Eyni anda yalnız bir bölmə açıq qalan açılan siyahı */
export const Accordion: React.FC<AccordionProps> = ({ items, defaultOpenId, className = '' }) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div
            key={item.id}
            className={`rounded-[20px] border bg-surface dark:bg-surface-dark shadow-calm transition-colors ${
              open
                ? 'border-brand-fg'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
            }`}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`acc-${item.id}`}
              onClick={() => setOpenId(open ? null : item.id)}
              className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
            >
              <div className="min-w-0 flex-1">{item.header}</div>
              <ChevronDown
                className={`w-5 h-5 shrink-0 text-stone-500 transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              id={`acc-${item.id}`}
              role="region"
              className={`grid transition-all duration-300 ease-out ${
                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 sm:px-6 pb-6 pt-1">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
