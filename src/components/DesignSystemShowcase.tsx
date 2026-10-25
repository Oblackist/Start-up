import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { ProgressRing } from './ProgressRing';

interface DesignSystemShowcaseProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesignSystemShowcase: React.FC<DesignSystemShowcaseProps> = ({ isOpen, onClose }) => {
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C'>('B');
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-surface-dark rounded-[24px] max-w-4xl w-full p-8 border border-slate-200 dark:border-slate-800 shadow-calm-lg max-h-[90vh] overflow-y-auto space-y-8 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand dark:text-blue-400">
                Career Arena · Exam Arena
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-brand dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                Design System & States
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-navy dark:text-white mt-1">
              Komponentlər və Vəziyyətlər
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. BUTTONS (Primary, Ghost, Disabled) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            1. Düymələr (12px radius, 48px hündürlük)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-500 block mb-1">Primary (Əsas)</span>
              <button className="w-full h-12 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-sm">
                Primary Button
              </button>
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">Ghost (Şəffaf / Haşiyəli)</span>
              <button className="w-full h-12 rounded-[12px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-navy dark:text-white text-sm font-semibold transition-all">
                Ghost Button
              </button>
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">Disabled (Qeyri-aktiv)</span>
              <button
                disabled
                className="w-full h-12 rounded-[12px] bg-slate-200 dark:bg-slate-800/50 text-slate-400 text-sm font-semibold cursor-not-allowed"
              >
                Disabled Button
              </button>
            </div>
          </div>
        </div>

        {/* 2. ANSWER OPTIONS (Default, Hover, Selected, Correct, Wrong) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            2. Cavab Seçimləri Vəziyyətləri (Answer Options)
          </h3>
          <div className="space-y-2.5">
            {/* Default */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center font-bold text-xs">
                A
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Default (İlkin vəziyyət)
              </span>
            </div>

            {/* Selected */}
            <div className="p-3.5 rounded-xl border-2 border-brand bg-brand-soft dark:bg-blue-950/40 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-xs">
                C
              </span>
              <span className="text-sm font-bold text-navy dark:text-white">
                Selected (Seçilmiş - Mavi haşiyə və zərif mavi fon)
              </span>
            </div>

            {/* Correct */}
            <div className="p-3.5 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xs">
                ✓
              </span>
              <span className="text-sm font-bold text-teal-800 dark:text-teal-300">
                Correct (Düzgün cavab - Sakit yaşıl/teal)
              </span>
            </div>

            {/* Wrong */}
            <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-[#EF4444] text-white flex items-center justify-center font-bold text-xs">
                ✕
              </span>
              <span className="text-sm font-bold text-red-800 dark:text-red-300">
                Wrong (Səhv cavab - Yumşaq qırmızı)
              </span>
            </div>
          </div>
        </div>

        {/* 3. PROGRESS RING & TOPIC BAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E172A] flex items-center justify-around">
            <ProgressRing
              progress={85}
              size={110}
              strokeWidth={10}
              color="#2563EB"
              label="Hazırlıq"
            />
            <ProgressRing
              progress={64}
              size={110}
              strokeWidth={10}
              color="#F59E0B"
              label="Orta səviyyə"
            />
          </div>

          <div className="p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0E172A] space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Topic Progress Bars</span>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Tənliklər sistemi</span>
                <span className="text-amber-600 font-bold">54%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-[#F59E0B]" style={{ width: '54%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Kvadrat tənliklər</span>
                <span className="text-teal-600 font-bold">88%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-accent" style={{ width: '88%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 4. CHIPS & QUESTION-NUMBER BUTTONS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            3. Çiplər və Sual Düymələri (Chips & Question Number Buttons)
          </h3>
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Amber: Zəif mövzu
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              Soft Red: Yüksək xəta
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Secondary Teal: Müvəffəqiyyət (+12%)
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-brand border border-blue-200">
              Primary Blue: DİM Buraxılış
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-slate-500">Sual düymələri:</span>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-xs shadow-sm">
                5
              </span>
              <span className="text-[11px] text-slate-500">Hazırkı (solid blue)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-[#DBEAFE] text-brand border border-blue-200 flex items-center justify-center font-semibold text-xs">
                3
              </span>
              <span className="text-[11px] text-slate-500">Cavablandırılmış (light blue)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-xs">
                8
              </span>
              <span className="text-[11px] text-slate-500">Cavabsız (neutral gray)</span>
            </div>
          </div>
        </div>

        {/* 5. TAB BAR & INPUT FIELD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
              Segmented Tab Bar
            </span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border text-xs font-semibold">
              {(['A', 'B', 'C'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-900 text-brand shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Bölmə {tab}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
              Input Field (12px radius, calm focus)
            </span>
            <input
              type="text"
              placeholder="Açar söz daxil edin..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full h-12 px-4 rounded-[12px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            />
          </div>
        </div>

        {/* 6. ACCORDION ITEM */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
            Accordion Item ("Səhvlərin təhlili")
          </span>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-[#0E172A]">
            <div
              onClick={() => setAccordionOpen(!accordionOpen)}
              className="p-4 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                  #5
                </span>
                <span className="text-sm font-bold text-navy dark:text-white">
                  İki ədədin cəmi 24, fərqi 6-dır...
                </span>
              </div>
              {accordionOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
            {accordionOpen && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-xs space-y-2">
                <span className="text-brand font-bold block">AI İzahı:</span>
                <p className="text-slate-600 dark:text-slate-300">
                  Sistem tənlik quraq: x + y = 24 və x - y = 6. Tərəf-tərəfə topladıqda 2x = 30 ⇒ x
                  = 15.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
