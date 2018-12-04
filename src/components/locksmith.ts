import PQueue from 'p-queue';

export default class Locksmith {
  queue: PQueue;

  constructor() {
    this.queue = new PQueue({ concurrency: 1 });
  }

  async executeAsyncFunction(asyncFunction) {
    return this.queue.add(asyncFunction);
  }
}
