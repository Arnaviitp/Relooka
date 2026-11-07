const mlClient = require('./ml.client');
const mlQueue = require('./ml.queue');

/**
 * LoopWear ML Background Inspection Worker Stub
 * Consumes inspection tasks from the ML queue and executes computer vision inspection.
 */
class MLWorker {
  constructor() {
    this.isListening = false;
  }

  start() {
    if (this.isListening) return;

    mlQueue.queue.process('inspect_garment_media', async (job) => {
      const { listingId, photos } = job.data;
      const results = [];

      for (const photo of photos || []) {
        const inspection = await mlClient.inspectImage({ imageUrl: photo, listingId });
        results.push(inspection);
      }

      return {
        listingId,
        photosEvaluated: results.length,
        allPassed: results.every(r => r.passed),
        results
      };
    });

    this.isListening = true;
  }
}

module.exports = new MLWorker();
