import { Download, Loader2 } from 'lucide-react';
import type { DownloadStatus } from '@/types';

interface DownloadButtonProps {
  onClick: () => void;
  status: DownloadStatus;
  disabled?: boolean;
}

export function DownloadButton({ onClick, status, disabled }: DownloadButtonProps) {
  const isWorking = status === 'fetching' || status === 'downloading' || status === 'converting';
  const isDone = status === 'completed';

  return (
    <button
      onClick={onClick}
      disabled={disabled || isWorking}
      className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {isWorking ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Working...</span>
        </>
      ) : isDone ? (
        <span>Download Again</span>
      ) : (
        <>
          <Download className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5" />
          <span>Download</span>
        </>
      )}
    </button>
  );
}
