import { expect } from 'chai';

import { DetectionConvertion } from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';

import DetectionsConverter from './../../src/utilitis/detectionsConverter';

describe('DetectionsConverter', () => {
  const predictions = [
    {
      label: 'person',
      bbox: {
        x: 10,
        y: 10,
        width: 60,
        height: 120,
      },
    },
    {
      label: 'couch',
      bbox: {
        x: 10,
        y: 10,
        width: 60,
        height: 120,
      },
    },
  ];
  const frame = {
    bbox: {
      x: 0,
      y: 0,
      width: 720,
      height: 405,
    },
  };
  const preview_image_size = { width: 640, height: 480 };
  let converterOpts;
  beforeEach(() => {
    converterOpts = {
      convertDetections: DetectionConvertion.FRAMING,
      frame,
      preview_image_size: preview_image_size,
    };
  });

  describe('RELATIVE', () => {
    it('should convert bbox coordinates absolute to the selected frame in main stream', () => {
      const newPredictions = new DetectionsConverter(predictions, converterOpts).convert();
      expect(newPredictions.length).to.equals(1);
      expect(newPredictions[0].label).to.equals('person');
      expect(newPredictions[0].bbox).to.deep.equals({
        x: 8.88888888888889,
        y: 11.851851851851851,
        width: 53.33333333333333,
        height: 142.22222222222223,
        frameWidth: 640,
        frameHeight: 480,
      });
    });
    it('should detect couch when objectFilter is set to all', () => {
      const newPredictions = new DetectionsConverter(predictions, {
        objectFilter: [],
        ...converterOpts,
      }).convert();
      expect(newPredictions.length).to.equals(2);
    });
    it('should detect objects specified by filter', () => {
      const newPredictions = new DetectionsConverter(predictions, {
        objectFilter: ['person'],
        ...converterOpts,
      }).convert();
      expect(newPredictions.length).to.equals(1);
    });
  });
  describe('ABSOLUTE', () => {
    it('should convert bbox absolute coordinates to relative (0 to 1 values)', async () => {
      converterOpts.convertDetections = DetectionConvertion.RELATIVE;
      const newPredictions = new DetectionsConverter(predictions, converterOpts).convert();
      expect(newPredictions.length).to.equals(1);
      expect(newPredictions[0].label).to.equals('person');
      expect(newPredictions[0].bbox).to.deep.equals({
        x: 0.015625,
        y: 0.020833333333333332,
        width: 0.09375,
        height: 0.25,
      });
    });
  });
});
