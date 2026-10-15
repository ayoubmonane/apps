import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { DownloadState } from '@/types';

interface DownloadProgressProps {
  state: DownloadState;
}

const ICONS: Record<DownloadState['status'], React.ReactNode> = {
  idle: null,
  fetching: <Loader2 className="h-5 w-5 animate-spin text-primary-500" />,
  converting: <Loader2 className="h-5 w-5 animate-spin text-accent-500" />,
  downloading: <Loader2 className="h-5 w-5 animate-spin text-primary-500" />,
  completed: <CheckCircle2 className="h-5 w-5 text-success-500" />,
  error: <AlertCircle className="h-5 w-5 text-error-500" />,
};

const BAR_COLORS: Record<DownloadState['status'], string> = {
  idle: 'bg-gray-300 dark:bg-gray-600',
  fetching: 'bg-primary-500',
  converting: 'bg-accent-500',
  downloading: 'bg-gradient-to-r from-primary-500 to-accent-500',
  completed: 'bg-gradient-to-r from-success-500 to-success-400',
  error: 'bg-error-500',
};

export function DownloadProgress({ state }: DownloadProgressProps) {
  if (state.status === 'idle') return null;

  const isActive = state.status === 'fetching' || state.status === 'downloading' || state.status === 'converting';
  const isIndeterminate = state.status === 'fetching';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-slide-up dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center gap-2.5">
        {ICONS[state.status]}
        <span
          className={`text-sm font-medium ${
            state.status === 'completed'
              ? 'text-success-600 dark:text-success-400'
              : state.status === 'error'
                ? 'text-error-600 dark:text-error-400'
                : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {state.statusText}
        </span>
        {state.status === 'completed' && (
          <span className="ml-auto rounded-lg bg-success-500/10 px-2.5 py-1 text-xs font-bold text-success-600 dark:text-success-400">
            {state.progress}%
          </span>
        )}
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        {isIndeterminate ? (
          <div className="absolute h-full w-1/4 rounded-full bg-primary-500 animate-progress-indeterminate" />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${BAR_COLORS[state.status]}`}
            style={{ width: `${state.progress}%` }}
          />
        )}
      </div>

      {!isIndeterminate && state.status !== 'error' && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{isActive ? 'Processing...' : 'Done'}</span>
          <span className="font-medium">{state.progress}%</span>
        </div>
      )}
    </div>
  );
}
