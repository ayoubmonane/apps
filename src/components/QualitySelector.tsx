import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { QualityMeta, QualityOption } from '@/types';

const QUALITY_OPTIONS: QualityMeta[] = [
  { value: '1080p', label: '1080p Full HD', badge: 'HD' },
  { value: '720p', label: '720p HD', badge: 'HD' },
  { value: '480p', label: '480p' },
  { value: '360p', label: '360p' },
  { value: 'best', label: 'Best Available' },
];

interface QualitySelectorProps {
  value: QualityOption;
  onChange: (value: QualityOption) => void;
  disabled?: boolean;
}

export function QualitySelector({ value, onChange, disabled }: QualitySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = QUALITY_OPTIONS.find((q) => q.value === value) ?? QUALITY_OPTIONS[4];

  return (
    <div ref={ref} className="relative">
      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Quality
      </label>
      <button
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600"
      >
        <span className="flex items-center gap-2">
          {selected.badge && (
            <span className="rounded-md bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
              {selected.badge}
            </span>
          )}
          {selected.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-xl animate-slide-down dark:border-gray-700 dark:bg-gray-800">
          {QUALITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200">
                {option.badge && (
                  <span className="rounded-md bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                    {option.badge}
                  </span>
                )}
                {option.label}
              </span>
              {option.value === value && (
                <Check className="h-4 w-4 text-primary-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
