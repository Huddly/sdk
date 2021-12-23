import PQueue from 'p-queue';

/**
 * Helper class for making sure a function is being locked/accessed by one thread at a time.
 *
 * @ignore
 * @class Locksmith
 */
export default class Locksmith {
  queue: PQueue;

  constructor() {
    this.queue = new PQueue({ concurrency: 1 });
  }

  async executeAsyncFunction(asyncFunction) {
    return this.queue.add(asyncFunction);
  }
}
