import express from 'express';
import cors from 'cors';
import { createReadStream, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { jobStore } from './jobs.js';
import { getVideoInfo, startDownloadJob } from './downloader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = join(__dirname, '..', 'tmp');
const PORT = process.env.GRABIT_PORT || process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

// Ensure tmp directory exists
await mkdir(TMP_DIR, { recursive: true }).catch(() => {});

// --- GET /api/health ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --- POST /api/info — fetch video metadata ---
app.post('/api/info', async (req, res) => {
  const { url } = req.body ?? {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required.' });
  }

  try {
    const info = await getVideoInfo(url);
    res.json(info);
  } catch (err) {
    const message = err.message || 'Failed to fetch video info.';
    if (message.includes('Video unavailable') || message.includes('private')) {
      return res.status(404).json({ error: 'This video is unavailable or private.' });
    }
    if (message.includes('age') || message.includes('Age')) {
      return res.status(403).json({ error: 'This video is age-restricted and cannot be downloaded.' });
    }
    res.status(500).json({ error: 'Could not fetch video info. Please check the URL and try again.' });
  }
});

// --- POST /api/download — start a download job ---
app.post('/api/download', (req, res) => {
  const { url, quality, format, title } = req.body ?? {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required.' });
  }

  const validQualities = ['1080p', '720p', '480p', '360p', 'best'];
  const validFormats = ['video', 'audio'];

  const q = validQualities.includes(quality) ? quality : 'best';
  const f = validFormats.includes(format) ? format : 'video';

  const job = jobStore.create(url, q, f);
  job._title = title || '';

  startDownloadJob(job);

  res.json({ jobId: job.id });
});

// --- GET /api/status/:jobId — SSE stream of job progress ---
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sendUpdate = (currentJob) => {
    res.write(`data: ${JSON.stringify({
      status: currentJob.status,
      progress: currentJob.progress,
      statusText: currentJob.statusText,
      error: currentJob.error,
      filename: currentJob.filename,
      filesize: currentJob.filesize,
    })}\n\n`);
  };

  // Send initial state
  sendUpdate(job);

  const isTerminal = () => job.status === 'completed' || job.status === 'error';

  // Poll for updates
  const pollInterval = setInterval(() => {
    const current = jobStore.get(jobId);
    if (!current) {
      res.write(`data: ${JSON.stringify({ status: 'error', statusText: 'Job expired.', error: 'Job expired.' })}\n\n`);
      res.end();
      clearInterval(pollInterval);
      return;
    }

    sendUpdate(current);

    if (current.status === 'completed' || current.status === 'error') {
      clearInterval(pollInterval);
      // Keep job around briefly so /api/file can still read it
      setTimeout(() => jobStore.remove(jobId), 10 * 60 * 1000);
      res.end();
    }
  }, 500);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(pollInterval);
  });
});

// --- GET /api/file/:jobId — download the completed file ---
app.get('/api/file/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found. It may have expired.' });
  }

  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'File is not ready yet.' });
  }

  if (!job.outputPath || !existsSync(job.outputPath)) {
    return res.status(404).json({ error: 'File no longer available. Please start a new download.' });
  }

  res.download(job.outputPath, job.filename, (err) => {
    if (err) {
      console.error('File download error:', err.message);
    }
  });
});

app.listen(PORT, () => {
  console.log(`GrabIt server running on http://localhost:${PORT}`);
});
