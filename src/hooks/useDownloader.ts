import { useCallback, useRef, useState } from 'react';
import type { DownloadState, FormatType, QualityOption, VideoInfo } from '@/types';

export function isValidVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSupportedUrl(url: string): boolean {
  // yt-dlp/ytdl-core supports many platforms; we accept common ones
  const SUPPORTED = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv|tiktok\.com|instagram\.com|facebook\.com|twitter\.com|x\.com|reddit\.com|streamable\.com|soundcloud\.com)/i;
  return SUPPORTED.test(url.trim());
}

interface UseDownloaderResult {
  state: DownloadState;
  videoInfo: VideoInfo | null;
  loadingInfo: boolean;
  fetchInfo: (url: string) => Promise<VideoInfo | null>;
  fetchInfoError: string | null;
  startDownload: (url: string, quality: QualityOption, format: FormatType, title?: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: DownloadState = {
  status: 'idle',
  progress: 0,
  statusText: '',
};

export function useDownloader(): UseDownloaderResult {
  const [state, setState] = useState<DownloadState>(INITIAL_STATE);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [fetchInfoError, setFetchInfoError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const fetchInfo = useCallback(async (url: string): Promise<VideoInfo | null> => {
    setLoadingInfo(true);
    setFetchInfoError(null);
    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchInfoError(data.error || 'Failed to fetch video info.');
        setVideoInfo(null);
        return null;
      }
      setVideoInfo(data);
      return data;
    } catch {
      setFetchInfoError('Could not connect to the server. Is the backend running?');
      setVideoInfo(null);
      return null;
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  const startDownload = useCallback(
    async (url: string, quality: QualityOption, format: FormatType, title?: string) => {
      closeEventSource();
      setState({ status: 'fetching', progress: 0, statusText: 'Starting download...' });

      try {
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, quality, format, title: title || '' }),
        });
        const data = await res.json();
        if (!res.ok) {
          setState({
            status: 'error',
            progress: 0,
            statusText: data.error || 'Failed to start download.',
          });
          return;
        }

        const jobId = data.jobId;

        // Subscribe to SSE for progress updates
        const sse = new EventSource(`/api/status/${jobId}`);
        eventSourceRef.current = sse;

        sse.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            setState({
              status: update.status,
              progress: update.progress ?? 0,
              statusText: update.statusText ?? '',
            });

            if (update.status === 'completed') {
              closeEventSource();
              // Trigger the browser file download
              const fileUrl = `/api/file/${jobId}`;
              const a = document.createElement('a');
              a.href = fileUrl;
              a.download = update.filename || 'download';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } else if (update.status === 'error') {
              closeEventSource();
            }
          } catch {
            // ignore malformed SSE data
          }
        };

        sse.onerror = () => {
          closeEventSource();
          setState((prev) =>
            prev.status === 'completed' || prev.status === 'error'
              ? prev
              : { status: 'error', progress: 0, statusText: 'Connection to server lost.' }
          );
        };
      } catch {
        setState({
          status: 'error',
          progress: 0,
          statusText: 'Could not connect to the server. Is the backend running?',
        });
      }
    },
    [closeEventSource]
  );

  const reset = useCallback(() => {
    closeEventSource();
    setState(INITIAL_STATE);
    setVideoInfo(null);
    setFetchInfoError(null);
  }, [closeEventSource]);

  return { state, videoInfo, loadingInfo, fetchInfo, fetchInfoError, startDownload, reset };
}
