const fs = require('fs');
const path = require('path');
const env = require('../config/env');

class StorageAdapter {
  async saveFile({ buffer, originalname, mimetype, folder = 'general' }) {
    throw new Error('saveFile() must be implemented');
  }
  async deleteFile(fileKey) {
    throw new Error('deleteFile() must be implemented');
  }
  getFileUrl(fileKey) {
    throw new Error('getFileUrl() must be implemented');
  }
}

/**
 * Local Disk Storage Adapter for Dev and Testing
 */
class LocalStorageAdapter extends StorageAdapter {
  constructor(baseDir) {
    super();
    this.baseDir = baseDir || env.UPLOAD_DIR;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile({ buffer, originalname, mimetype, folder = 'general' }) {
    const targetDir = path.join(this.baseDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(originalname) || (mimetype.includes('video') ? '.mp4' : '.jpg');
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(targetDir, filename);

    await fs.promises.writeFile(filePath, buffer);
    const fileKey = `${folder}/${filename}`;

    return {
      fileKey,
      url: `/uploads/${fileKey}`,
      size: buffer.length,
      mimetype
    };
  }

  async deleteFile(fileKey) {
    const filePath = path.join(this.baseDir, fileKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  getFileUrl(fileKey) {
    return `/uploads/${fileKey}`;
  }
}

/**
 * Free-Tier Cloud Media Adapter Stub (e.g. Cloudinary / Supabase Free Storage)
 * Falls back automatically to local storage if credentials are not configured.
 */
class FreeMediaStorageAdapter extends StorageAdapter {
  constructor() {
    super();
    this.localFallback = new LocalStorageAdapter();
  }

  async saveFile(params) {
    // If external cloud credentials aren't set, use localFallback
    return this.localFallback.saveFile(params);
  }

  async deleteFile(fileKey) {
    return this.localFallback.deleteFile(fileKey);
  }

  getFileUrl(fileKey) {
    return this.localFallback.getFileUrl(fileKey);
  }
}

function createStorageAdapter() {
  if (env.STORAGE_DRIVER === 'freemedia') {
    return new FreeMediaStorageAdapter();
  }
  return new LocalStorageAdapter();
}

module.exports = {
  StorageAdapter,
  LocalStorageAdapter,
  FreeMediaStorageAdapter,
  storageAdapter: createStorageAdapter()
};
