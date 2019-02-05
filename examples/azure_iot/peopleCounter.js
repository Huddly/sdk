const EventEmitter = require('events').EventEmitter;

function median(numbers) {
  let median = 0;
  const length = numbers.length;
  numbers.sort();

  if (length % 2 === 0) { // is even
      // average of two middle numbers
      median = (numbers[length / 2 - 1] + numbers[length / 2]) / 2;
  } else { // is odd
      // middle number only
      median = numbers[(length - 1) / 2];
  }
  return median;
}

exports.default = class PeopleCounter extends EventEmitter {
  constructor(cameraManager) {
    super();
    this.cameraManager = cameraManager;
    this.cache = [];
  }

  async init() {
    const detector = await this.cameraManager.getDetector();
    await detector.init();

    detector.on('DETECTIONS', async detections => {
      this.cache.push(detections); 
    });
    this.updateInterval = setInterval(this.collect.bind(this), 5000);
    detector.start();
  }

  collect() {
    if (!this.cache && this.cache.length === 0) {
      return;
    }
    const countArray = this.cache.map(detections => detections ? detections.length : 0);
    const medCount = median(countArray);
    const detection = this.cache.find(detections => detections.length === medCount);
    this.emit('PEOPLE_COUNT', detection);
    this.cache = [];
  }
}