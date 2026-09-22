const { BlobServiceClient } = require('@azure/storage-blob');

// Private blobs are the source of truth; no room exists only in a warm worker.
// Conditional writes serialize requests across Function instances and deployments.
class BlobRoomStore {
  constructor(connectionString) {
    if (!connectionString) throw new Error('Werewolf storage is not configured.');
    this.container = BlobServiceClient.fromConnectionString(connectionString).getContainerClient('werewolf-private');
    this.ready = null;
  }
  async init() {
    if (!this.ready) this.ready = this.container.createIfNotExists().catch(error => { this.ready = null; throw error; });
    await this.ready;
  }
  async read(key) {
    await this.init();
    const blob = this.container.getBlockBlobClient(`${key}.json`);
    try {
      const result = await blob.download(0, undefined, { abortSignal: AbortSignal.timeout(15000) });
      const chunks = [];
      for await (const chunk of result.readableStreamBody) chunks.push(chunk);
      return { value: JSON.parse(Buffer.concat(chunks).toString('utf8')), etag: result.etag };
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw error;
    }
  }
  async write(key, value, etag) {
    await this.init();
    const data = Buffer.from(JSON.stringify(value));
    try {
      await this.container.getBlockBlobClient(`${key}.json`).uploadData(data, {
        conditions: etag ? { ifMatch: etag } : { ifNoneMatch: '*' },
        blobHTTPHeaders: { blobContentType: 'application/json', blobCacheControl: 'no-store' },
        abortSignal: AbortSignal.timeout(15000),
      });
      return true;
    } catch (error) {
      if (error.statusCode === 409 || error.statusCode === 412) return false;
      throw error;
    }
  }
  async transact(key, callback) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const entry = await this.read(key);
      const { value, result, changed = true } = await callback(entry?.value ?? null);
      if (!changed || await this.write(key, value, entry?.etag)) return result;
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * Math.min(250, attempt * 40)));
    }
    const error = new Error('The room is busy. Please retry.');
    error.code = 'room-busy'; error.status = 409; error.clientSafe = true; throw error;
  }
}

module.exports = { BlobRoomStore };
