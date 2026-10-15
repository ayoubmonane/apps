import { Clock, User } from 'lucide-react';
import type { VideoInfo } from '@/types';

interface PreviewCardProps {
  info: VideoInfo | null;
  visible: boolean;
  loading?: boolean;
}

export function PreviewCard({ info, visible, loading }: PreviewCardProps) {
  if (!visible) return null;

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-slide-up dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 p-3 sm:flex-row">
          <div className="shimmer-bg aspect-video w-full shrink-0 animate-pulse-soft rounded-xl bg-gray-100 dark:bg-gray-700 sm:w-56" />
          <div className="flex flex-1 flex-col justify-center gap-3 px-1 pb-1">
            <div className="h-4 w-3/4 shimmer-bg animate-pulse-soft rounded bg-gray-100 dark:bg-gray-700" />
            <div className="h-3 w-1/2 shimmer-bg animate-pulse-soft rounded bg-gray-100 dark:bg-gray-700" />
            <div className="h-3 w-1/3 shimmer-bg animate-pulse-soft rounded bg-gray-100 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-slide-up dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 p-3 sm:flex-row">
        {/* Thumbnail */}
        <div className="relative shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700 sm:w-56">
          <img
            src={info.thumbnailUrl}
            alt={info.title}
            className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.classList.add('flex', 'items-center', 'justify-center');
                parent.innerHTML = '<span class="text-sm text-gray-400">No preview</span>';
              }
            }}
          />
          <div className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur">
            {info.duration}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-center gap-2 px-1 pb-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {info.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {info.channel}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {info.duration}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
            <span className="text-xs font-medium text-success-600 dark:text-success-400">Ready to download</span>
          </div>
        </div>
      </div>
    </div>
  );
}
