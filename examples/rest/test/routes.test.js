import request from 'supertest';
import server from '../src';
import camera from '../src/controllers/camera';

afterEach(async () => {
  await server.close();
});

describe('GET /info', () => {
  beforeEach(async () => {
    await camera.isConnected();
  });

  it('should return camera information ', async () => {
    await request(server)
      .get('/info')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
         expect(response.body.productId).not.toBeNull();
         expect(response.body.serialNumber).not.toBeNull();
     });
  });
});
