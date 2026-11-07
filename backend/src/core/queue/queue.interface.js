const env = require('../config/env');

class QueueInterface {
  async add(jobName, data, options = {}) {
    throw new Error('add() must be implemented');
  }
  process(jobName, handler) {
    throw new Error('process() must be implemented');
  }
  async close() {
    throw new Error('close() must be implemented');
  }
}

/**
 * In-Process Memory Queue Adapter
 * Zero-budget friendly: requires 0 Redis instances, works on sleeping free-tier hosts.
 */
class MemoryQueueAdapter extends QueueInterface {
  constructor(name = 'default') {
    super();
    this.name = name;
    this.handlers = new Map();
    this.isProcessing = false;
    this.queue = [];
  }

  async add(jobName, data, options = {}) {
    const job = {
      id: `mem_job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: jobName,
      data,
      options,
      attempts: 0,
      createdAt: new Date()
    };

    const delay = options.delay || 0;
    if (delay > 0) {
      setTimeout(() => {
        this._dispatch(job);
      }, delay);
    } else {
      // Async dispatch on next tick
      setImmediate(() => {
        this._dispatch(job);
      });
    }

    return { id: job.id, name: jobName, data };
  }

  process(jobName, handler) {
    this.handlers.set(jobName, handler);
  }

  async _dispatch(job) {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      // No handler registered yet; job drops or waits
      return;
    }

    try {
      job.attempts += 1;
      await handler(job);
    } catch (err) {
      console.error(`[MemoryQueue ${this.name}] Job ${job.name} (${job.id}) failed:`, err.message);
      const maxAttempts = job.options.attempts || 1;
      if (job.attempts < maxAttempts) {
        // Retry
        setTimeout(() => this._dispatch(job), (job.options.backoff || 1000) * job.attempts);
      }
    }
  }

  async close() {
    this.handlers.clear();
    this.queue = [];
    return true;
  }
}

/**
 * BullMQ Queue Adapter (Optional for local Redis or external managed Redis)
 */
class BullMQAdapter extends QueueInterface {
  constructor(queueName = 'loopwear_queue') {
    super();
    this.queueName = queueName;
    try {
      const { Queue, Worker } = require('bullmq');
      const IORedis = require('ioredis');

      this.connection = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: () => null // don't hang indefinitely if redis is offline
      });

      this.queue = new Queue(queueName, { connection: this.connection });
      this.Worker = Worker;
      this.workers = [];
      this.isReady = true;
    } catch (err) {
      console.warn('[BullMQ] Failed to initialize BullMQ; falling back to MemoryQueueAdapter:', err.message);
      this.isReady = false;
      this.fallback = new MemoryQueueAdapter(queueName);
    }
  }

  async add(jobName, data, options = {}) {
    if (!this.isReady || this.fallback) {
      return this.fallback.add(jobName, data, options);
    }
    return this.queue.add(jobName, data, options);
  }

  process(jobName, handler) {
    if (!this.isReady || this.fallback) {
      return this.fallback.process(jobName, handler);
    }
    const worker = new this.Worker(
      this.queueName,
      async job => {
        if (job.name === jobName) {
          return handler(job);
        }
      },
      { connection: this.connection }
    );
    this.workers.push(worker);
  }

  async close() {
    if (this.fallback) return this.fallback.close();
    for (const w of this.workers) {
      await w.close();
    }
    if (this.queue) await this.queue.close();
    if (this.connection) await this.connection.quit();
  }
}

function createQueue(queueName = 'default') {
  if (env.QUEUE_TYPE === 'bullmq') {
    return new BullMQAdapter(queueName);
  }
  return new MemoryQueueAdapter(queueName);
}

module.exports = {
  QueueInterface,
  MemoryQueueAdapter,
  BullMQAdapter,
  createQueue,
  defaultQueue: createQueue('loopwear_jobs')
};
