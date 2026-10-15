import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-error-500/30 bg-error-500/10 p-4 animate-slide-down">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error-500" />
      <p className="flex-1 text-sm text-error-600 dark:text-error-400">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 rounded-lg p-1 text-error-400 transition-colors hover:bg-error-500/10 hover:text-error-600 dark:hover:text-error-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
