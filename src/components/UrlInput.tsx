import { Clipboard, Link2, X } from 'lucide-react';
import { useCallback } from 'react';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onPaste: () => void;
  disabled?: boolean;
}

export function UrlInput({ value, onChange, onPaste, disabled }: UrlInputProps) {
  const handleClipboardPaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text.trim());
        onPaste();
      }
    } catch {
      onPaste();
    }
  }, [onChange, onPaste]);

  return (
    <div className="group relative">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/20 to-accent-500/20 opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100" />
      <div className="relative flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm transition-all duration-300 focus-within:border-primary-400 focus-within:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-primary-500">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors group-focus-within:bg-primary-50 group-focus-within:text-primary-500 dark:bg-gray-700/50 dark:text-gray-500 dark:group-focus-within:bg-primary-500/10 dark:group-focus-within:text-primary-400">
          <Link2 className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          disabled={disabled}
          placeholder="Paste your video URL here..."
          className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-base text-gray-900 placeholder-gray-400 outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:placeholder-gray-500"
          spellCheck={false}
          autoComplete="off"
        />
        {value && !disabled && (
          <button
            onClick={() => onChange('')}
            aria-label="Clear input"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleClipboardPaste}
          disabled={disabled}
          aria-label="Paste from clipboard"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-500 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Clipboard className="h-4 w-4" />
          <span className="hidden sm:inline">Paste</span>
        </button>
      </div>
    </div>
  );
}
