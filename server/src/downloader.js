import ytdl from '@distube/ytdl-core';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { unlinkSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jobStore } from './jobs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = join(__dirname, '..', 'tmp');

const FFMPEG = existsSync(ffmpegPath) ? ffmpegPath : 'ffmpeg';

const QUALITY_MAP = {
  '1080p': { video: 137, audio: 140 },
  '720p': { video: 136, audio: 140 },
  '480p': { video: 135, audio: 140 },
  '360p': { video: 134, audio: 140 },
  'best': { video: 137, audio: 140 },
};



export async function getVideoInfo(url) {
  if (!ytdl.validateURL(url)) {
    throw new Error('Invalid YouTube URL');
  }

  const info = await ytdl.getInfo(url, {
    requestOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    },
  });

  const durationSec = parseInt(info.videoDetails.lengthSeconds, 10);
  const formattedDuration = formatDuration(durationSec);

  const thumbnail =
    info.videoDetails.thumbnails?.pop()?.url ??
    `https://i.ytimg.com/vi/${ytdl.getVideoID(url)}/hqdefault.jpg`;

  return {
    title: info.videoDetails.title,
    channel: info.videoDetails.author?.name ?? 'Unknown',
    duration: formattedDuration,
    thumbnailUrl: thumbnail,
  };
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return 'Unknown';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function sanitizeFilename(title) {
  return (
    title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 80) || 'video'
  );
}

export function startDownloadJob(job) {
  const { id, url, quality, format } = job;
  const isAudio = format === 'audio';
  const baseFilename = `${sanitizeFilename(job._title || 'video')}_${id}`;
  const outputExt = isAudio ? 'mp3' : 'mp4';
  const outputPath = join(TMP_DIR, `${baseFilename}.${outputExt}`);

  try {
    if (isAudio) {
      processAudioDownload(id, url, quality, outputPath, baseFilename, outputExt);
    } else {
      processVideoDownload(id, url, quality, outputPath, baseFilename, outputExt);
    }
  } catch (err) {
    jobStore.update(id, {
      status: 'error',
      error: err.message,
      statusText: 'Download failed to start.',
    });
  }
}

function processVideoDownload(id, url, quality, outputPath, baseFilename, outputExt) {
  let videoStream = null;
  let audioStream = null;
  let videoEnded = false;
  let audioEnded = false;
  let videoErrored = false;
  let audioErrored = false;
  let totalSize = 0;
  let downloadedSize = 0;

  jobStore.update(id, {
    status: 'downloading',
    progress: 2,
    statusText: 'Starting video download...',
  });

  const requestOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  };

  try {
    videoStream = ytdl(url, {
      quality: QUALITY_MAP[quality]?.video ?? QUALITY_MAP['best'].video,
      requestOptions,
    });
  } catch {
    videoStream = ytdl(url, { quality: 'highest', requestOptions });
  }

  videoStream.on('info', (info, format) => {
    totalSize = format.contentLength ? parseInt(format.contentLength, 10) : 0;
  });

  videoStream.on('error', (err) => {
    if (videoErrored) return;
    videoErrored = true;
    jobStore.update(id, {
      status: 'error',
      error: err.message,
      statusText: 'Failed to download video stream.',
    });
  });

  videoStream.on('progress', (_, chunk, total) => {
    if (total > 0) {
      totalSize = total;
      downloadedSize += chunk.length;
      const pct = totalSize > 0 ? Math.min(90, Math.round((downloadedSize / totalSize) * 90)) : 0;
      jobStore.update(id, {
        progress: pct,
        statusText: 'Downloading video stream...',
      });
    }
  });

  try {
    audioStream = ytdl(url, {
      quality: 'highestaudio',
      requestOptions,
    });
  } catch {
    audioStream = ytdl(url, { quality: 'highest', requestOptions });
  }

  audioStream.on('error', (err) => {
    if (audioErrored) return;
    audioErrored = true;
    jobStore.update(id, {
      status: 'error',
      error: err.message,
      statusText: 'Failed to download audio stream.',
    });
  });

  const ffmpegArgs = [
    '-y',
    '-i', 'pipe:3',
    '-i', 'pipe:4',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-movflags', '+faststart',
    outputPath,
  ];

  const ffmpeg = spawn(FFMPEG, ffmpegArgs, { stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe'] });

  videoStream.pipe(ffmpeg.stdio[3]);
  audioStream.pipe(ffmpeg.stdio[4]);

  ffmpeg.stderr.on('data', () => {
    // Progress is tracked via stream events
  });

  ffmpeg.on('error', () => {
    jobStore.update(id, {
      status: 'error',
      error: 'ffmpeg failed to start. Is ffmpeg installed?',
      statusText: 'Processing failed - ffmpeg not found.',
    });
  });

  ffmpeg.on('close', (code) => {
    videoEnded = true;
    audioEnded = true;

    if (code !== 0) {
      if (!videoErrored && !audioErrored) {
        jobStore.update(id, {
          status: 'error',
          error: `ffmpeg exited with code ${code}`,
          statusText: 'Processing failed during muxing.',
        });
      }
      return;
    }

    let fileSize = 0;
    try {
      fileSize = statSync(outputPath).size;
    } catch {
      // file might not exist
    }

    jobStore.update(id, {
      status: 'completed',
      progress: 100,
      statusText: 'Completed! Your file is ready.',
      filename: `${baseFilename}.${outputExt}`,
      filesize: fileSize,
      outputPath,
    });

    // Auto-cleanup file after 5 minutes
    setTimeout(() => {
      try {
        unlinkSync(outputPath);
      } catch {
        // already cleaned up
      }
    }, 5 * 60 * 1000);
  });
}

function processAudioDownload(id, url, quality, outputPath, baseFilename, outputExt) {
  jobStore.update(id, {
    status: 'downloading',
    progress: 5,
    statusText: 'Downloading audio stream...',
  });

  const requestOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  };

  let audioStream;
  try {
    audioStream = ytdl(url, { quality: 'highestaudio', requestOptions });
  } catch {
    audioStream = ytdl(url, { quality: 'highest', requestOptions });
  }

  let totalSize = 0;
  let downloadedSize = 0;

  audioStream.on('info', (_, format) => {
    totalSize = format.contentLength ? parseInt(format.contentLength, 10) : 0;
  });

  audioStream.on('progress', (_, chunk, total) => {
    if (total > 0) {
      totalSize = total;
      downloadedSize += chunk.length;
      const pct = totalSize > 0 ? Math.min(80, Math.round((downloadedSize / totalSize) * 80)) : 0;
      jobStore.update(id, {
        progress: pct,
        statusText: 'Downloading audio stream...',
      });
    }
  });

  audioStream.on('error', (err) => {
    jobStore.update(id, {
      status: 'error',
      error: err.message,
      statusText: 'Failed to download audio stream.',
    });
  });

  const ffmpegArgs = [
    '-y',
    '-i', 'pipe:0',
    '-vn',
    '-acodec', 'libmp3lame',
    '-ab', '192k',
    '-ar', '44100',
    outputPath,
  ];

  const ffmpeg = spawn(FFMPEG, ffmpegArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

  audioStream.pipe(ffmpeg.stdin);

  ffmpeg.stderr.on('data', () => {
    // Could parse ffmpeg progress output for more granular progress
  });

  let convertingStarted = false;

  ffmpeg.on('error', () => {
    jobStore.update(id, {
      status: 'error',
      error: 'ffmpeg failed to start. Is ffmpeg installed?',
      statusText: 'Processing failed - ffmpeg not found.',
    });
  });

  audioStream.on('end', () => {
    if (!convertingStarted) {
      convertingStarted = true;
      jobStore.update(id, {
        status: 'converting',
        progress: 85,
        statusText: 'Converting to MP3...',
      });
    }
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0) {
      jobStore.update(id, {
        status: 'error',
        error: `ffmpeg exited with code ${code}`,
        statusText: 'Conversion failed.',
      });
      return;
    }

    let fileSize = 0;
    try {
      fileSize = statSync(outputPath).size;
    } catch {
      // file might not exist
    }

    jobStore.update(id, {
      status: 'completed',
      progress: 100,
      statusText: 'Completed! Your MP3 is ready.',
      filename: `${baseFilename}.${outputExt}`,
      filesize: fileSize,
      outputPath,
    });

    setTimeout(() => {
      try {
        unlinkSync(outputPath);
      } catch {
        // already cleaned up
      }
    }, 5 * 60 * 1000);
  });
}
