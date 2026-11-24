import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const inputClass = (hasError: boolean) =>
  `h-12 w-full rounded-[12px] border bg-surface dark:bg-inset-dark px-4 text-sm text-ink dark:text-paper placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-500 focus:ring-red-500/30'
      : 'border-stone-200 dark:border-stone-800 focus:border-brand-fg focus:ring-brand-fg/30'
  }`;

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ id, label, error, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-semibold text-ink dark:text-paper">
      {label}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} className="text-xs font-medium text-red-600 dark:text-red-400">
        {error}
      </p>
    )}
  </div>
);

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  error?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass(!!error)} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
        className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:text-ink dark:hover:text-paper transition-colors"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
