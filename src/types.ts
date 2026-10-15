export type QualityOption =
  | '1080p'
  | '720p'
  | '480p'
  | '360p'
  | 'best';

export type FormatType = 'video' | 'audio';

export type DownloadStatus =
  | 'idle'
  | 'fetching'
  | 'converting'
  | 'downloading'
  | 'completed'
  | 'error';

export interface VideoInfo {
  thumbnailUrl: string;
  title: string;
  duration: string;
  channel: string;
}

export interface DownloadState {
  status: DownloadStatus;
  progress: number;
  statusText: string;
}

export interface QualityMeta {
  value: QualityOption;
  label: string;
  badge?: string;
}
