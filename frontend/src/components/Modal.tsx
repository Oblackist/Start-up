import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** false olarsa, Escape və fona klik bağlamır (imtahan xəbərdarlıqları üçün) */
  dismissible?: boolean;
  onClose?: () => void;
  tone?: 'default' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

const TONE = {
  default: 'bg-brand-soft dark:bg-brand-950/60 text-brand-fg',
  warning: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
  danger: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  children,
  footer,
  dismissible = true,
  onClose,
  tone = 'default',
  icon,
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    else if (!open && element?.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose?.();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose?.();
      }}
      className="m-auto bg-transparent p-3 text-ink dark:text-paper backdrop:bg-black/55 backdrop:backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-[20px] bg-surface dark:bg-surface-dark border border-stone-200 dark:border-stone-800 shadow-calm-lg p-6 sm:p-7">
        <div className="flex items-start gap-3.5">
          {icon && (
            <span
              className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${TONE[tone]}`}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 space-y-2">
            <h2 className="text-lg font-bold text-ink dark:text-white leading-snug">{title}</h2>
            <div className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {children}
            </div>
          </div>
        </div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2.5">{footer}</div>}
      </div>
    </dialog>
  );
};
