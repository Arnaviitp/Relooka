const { createQueue } = require('../../core/queue/queue.interface');

/**
 * LoopWear ML Job Queue Stub
 * Places background media inspection tasks onto the Memory/BullMQ queue.
 */
class MLQueue {
  constructor() {
    this.queue = createQueue('ml_garment_qc_jobs');
  }

  async enqueueMediaInspection({ listingId, photos = [], video = null, priority = 'normal' }) {
    const job = await this.queue.add('inspect_garment_media', {
      listingId,
      photos,
      video,
      enqueuedAt: new Date(),
      priority
    });
    return job;
  }

  async close() {
    await this.queue.close();
  }
}

module.exports = new MLQueue();
