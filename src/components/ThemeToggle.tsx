import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-600 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:border-gray-600"
    >
      <Sun
        className={`absolute h-5 w-5 transition-all duration-500 ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-500 ${
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}
