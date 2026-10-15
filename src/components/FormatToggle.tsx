import { Film, Music } from 'lucide-react';
import type { FormatType } from '@/types';

interface FormatToggleProps {
  value: FormatType;
  onChange: (value: FormatType) => void;
  disabled?: boolean;
}

export function FormatToggle({ value, onChange, disabled }: FormatToggleProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Format
      </label>
      <div className="relative grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-gray-100/80 p-1.5 dark:border-gray-700 dark:bg-gray-800/80">
        <button
          onClick={() => onChange('video')}
          disabled={disabled}
          className={`relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
            value === 'video'
              ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Film className="h-4 w-4" />
          Video (MP4)
        </button>
        <button
          onClick={() => onChange('audio')}
          disabled={disabled}
          className={`relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
            value === 'audio'
              ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Music className="h-4 w-4" />
          Audio (MP3)
        </button>
      </div>
    </div>
  );
}
