import { DownloadCloud, Github, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DownloadButton } from '@/components/DownloadButton';
import { DownloadProgress } from '@/components/DownloadProgress';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormatToggle } from '@/components/FormatToggle';
import { PreviewCard } from '@/components/PreviewCard';
import { QualitySelector } from '@/components/QualitySelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UrlInput } from '@/components/UrlInput';
import { useDownloader, isSupportedUrl, isValidVideoUrl } from '@/hooks/useDownloader';
import { useTheme } from '@/hooks/useTheme';
import type { FormatType, QualityOption } from '@/types';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { state, videoInfo, loadingInfo, fetchInfo, fetchInfoError, startDownload, reset } = useDownloader();

  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<QualityOption>('1080p');
  const [format, setFormat] = useState<FormatType>('video');
  const [error, setError] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWorking = state.status === 'fetching' || state.status === 'downloading' || state.status === 'converting';

  // Auto-fetch video info when user stops typing a valid URL
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!url.trim() || !isValidVideoUrl(url) || !isSupportedUrl(url)) {
      setPreviewVisible(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setPreviewVisible(true);
      await fetchInfo(url);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [url, fetchInfo]);

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      setError(null);
      if (state.status !== 'idle' && state.status !== 'error') reset();
    },
    [state.status, reset]
  );

  const handleUrlPaste = useCallback(() => {
    setError(null);
    // The debounce effect will auto-fetch; also trigger immediately for paste
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setTimeout(async () => {
      const currentUrl = url;
      if (!currentUrl.trim()) return;
      if (!isValidVideoUrl(currentUrl)) {
        setError('That does not look like a valid URL. Please check and try again.');
        return;
      }
      if (!isSupportedUrl(currentUrl)) {
        setError('This platform is not supported. Please paste a link from YouTube, Vimeo, TikTok, or similar sites.');
        return;
      }
      setPreviewVisible(true);
      await fetchInfo(currentUrl);
    }, 50);
  }, [url, fetchInfo]);

  const handleDownload = useCallback(() => {
    setError(null);

    if (!url.trim()) {
      setError('Please paste a video URL first.');
      return;
    }
    if (!isValidVideoUrl(url)) {
      setError('That does not look like a valid URL. Please check and try again.');
      return;
    }
    if (!isSupportedUrl(url)) {
      setError('This platform is not supported. Please paste a link from YouTube, Vimeo, TikTok, or similar sites.');
      return;
    }

    setPreviewVisible(true);
    startDownload(url, quality, format, videoInfo?.title);
  }, [url, quality, format, videoInfo, startDownload]);

  const handleReset = useCallback(() => {
    reset();
    setUrl('');
    setError(null);
    setPreviewVisible(false);
  }, [reset]);

  // Surface fetch info errors
  useEffect(() => {
    if (fetchInfoError) {
      setError(fetchInfoError);
      setPreviewVisible(false);
    }
  }, [fetchInfoError]);

  const showPreview = useMemo(
    () => previewVisible && (loadingInfo || videoInfo !== null),
    [previewVisible, loadingInfo, videoInfo]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 text-gray-900 transition-colors duration-500 dark:bg-gray-950 dark:text-gray-100">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-500/15" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl dark:bg-accent-500/15" />
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25">
            <DownloadCloud className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">GrabIt</h1>
            <p className="-mt-0.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">Video & Audio Downloader</p>
          </div>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-20">
        {/* Hero */}
        <div className="mb-8 mt-6 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/60 px-3 py-1 text-xs font-medium text-gray-500 backdrop-blur dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400">
            <Sparkles className="h-3 w-3 text-primary-500" />
            Fast, clean, no ads
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Download videos in
            <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent"> seconds</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Paste any video link, choose your quality and format, and grab it instantly.
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-5 shadow-xl shadow-gray-200/40 backdrop-blur-xl animate-slide-up dark:border-gray-800/80 dark:bg-gray-900/80 dark:shadow-black/20 sm:p-6">
          {/* URL Input */}
          <UrlInput
            value={url}
            onChange={handleUrlChange}
            onPaste={handleUrlPaste}
            disabled={isWorking}
          />

          {/* Error */}
          {error && (
            <div className="mt-4">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {/* Preview */}
          <div className="mt-4">
            <PreviewCard info={videoInfo} visible={showPreview} loading={loadingInfo} />
          </div>

          {/* Options grid */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <QualitySelector value={quality} onChange={setQuality} disabled={isWorking} />
            <FormatToggle value={format} onChange={setFormat} disabled={isWorking} />
          </div>

          {/* Download button */}
          <div className="mt-5">
            <DownloadButton onClick={handleDownload} status={state.status} disabled={!url.trim()} />
          </div>

          {/* Progress */}
          <div className="mt-4">
            <DownloadProgress state={state} />
          </div>

          {/* Reset link */}
          {(state.status === 'completed' || state.status === 'error') && (
            <div className="mt-3 text-center animate-fade-in">
              <button
                onClick={handleReset}
                className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                Start over
              </button>
            </div>
          )}
        </div>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/60 px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900/60">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
            No registration
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/60 px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900/60">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Multiple qualities
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/60 px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900/60">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            MP4 & MP3
          </span>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-2 text-center">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <Github className="h-3.5 w-3.5" />
            Open source
          </a>
          <p className="text-[11px] text-gray-300 dark:text-gray-600">
            For personal use only. Please respect copyright and platform terms of service.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
