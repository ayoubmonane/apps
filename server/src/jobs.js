import { randomUUID } from 'node:crypto';

export class JobStore {
  constructor() {
    this.jobs = new Map();
    this.cleanInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  create(url, quality, format) {
    const id = randomUUID();
    const job = {
      id,
      url,
      quality,
      format,
      status: 'fetching',
      progress: 0,
      statusText: 'Queued...',
      filename: null,
      error: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.jobs.set(id, job);
    return job;
  }

  get(id) {
    return this.jobs.get(id) ?? null;
  }

  update(id, patch) {
    const job = this.jobs.get(id);
    if (!job) return null;
    const updated = { ...job, ...patch, updatedAt: Date.now() };
    this.jobs.set(id, updated);
    return updated;
  }

  remove(id) {
    this.jobs.delete(id);
  }

  cleanup() {
    const maxAge = 30 * 60 * 1000;
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      if (now - job.updatedAt > maxAge) {
        this.jobs.delete(id);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanInterval);
  }
}

export const jobStore = new JobStore();
