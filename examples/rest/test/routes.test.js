import request from 'supertest';
import server from '../src';

afterEach(async () => {
  await server.close();
});

// describe.skip('GET /', () => {
//   it('should render application name and version', async () => {
//     await request(server)
//       .get('/')
//       .expect(200);
//   });
// });
//
// describe.skip('GET /404', () => {
//   it('should return 404 for non-existent URLs', async () => {
//     await request(server)
//       .get('/404')
//       .expect(404);
//     await request(server)
//       .get('/notfound')
//       .expect(404);
//   });
// });

describe('GET /info', () => {
  it('should return camera information ', async () => {
    await request(server)
      .get('/info')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        console.log(response.body);
         expect(response.body.serial_number).not.toBeNull();
         expect(response.body.software_version).not.toBeNull();
         expect(response.body.usb_id).not.toBeNull();
         expect(response.body.usb_path).not.toBeNull();
         expect(response.body.camera_name).toEqual('Huddly IQ');
         expect(response.body.uptime).not.toBeNull();
         // assert(response.body.mode, 'single');
         expect(response.body.streaming).toEqual(false);
     });
  });

  it.skip('should return 404 when no camera is attached', async () => {
    await request(server)
      .get('/info')
      .expect(404)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body.error_message).toEqual('Camera not found');
     });
  });
});

describe('GET /ptz', () => {
  it('should return current ptz info ', async () => {
    await request(server)
      .get('/ptz')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
         expect(response.body.pan).toEqual(0);
         expect(response.body.tilt).toEqual(0);
         expect(response.body.zoom).toEqual(1000);
     });
  });

  it.skip('should return 404 when no camera is attached', async () => {
    await request(server)
      .get('/ptz')
      .expect(404)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body.error_message).toEqual('Camera not found');
     });
  });
});

describe('POST /ptz', () => {
  it('should change current ptz values ', async () => {
    await request(server)
      .post('/ptz')
      .send({ pan: 100, tilt: 200, zoom: 1500 })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
         expect(response.body.pan).toEqual(100);
         expect(response.body.tilt).toEqual(200);
         expect(response.body.zoom).toEqual(1500);
     });
  });

  it('should fail with 400 if value is out of range ', async () => {
    await request(server)
      .post('/ptz')
      .send({ pan: 100, tilt: 200, zoom: 1 })
      .expect(400)
      .expect('Content-Type', /json/)
      .then(response => {
         expect(response.body.error_message).toEqual('zoom is out of range (1000 - 4000)');
     });
  });

  it.skip('should return 404 when no camera is attached', async () => {
    await request(server)
      .post('/ptz')
      .expect(404)
      .expect('Content-Type', /json/)
      .then(response => {
         expect(response.body.error_message).toEqual('Camera not found');
     });
  });

  afterEach(async() => {
    await request(server)
      .post('/ptz')
      .send({ pan: 0, tilt: 0, zoom: 1000 })
  });
});
//
// describe.skip('GET /error_log', () => {
//   it('should return a string with the current error log ', async () => {
//     await request(server)
//       .get('/error_log')
//       .expect(200)
//       .expect('Content-Type', /json/)
//       .then(response => {
//          assert(response.body.log.length, 1234);
//      });
//   });
// });
//
// describe.skip('DELETE /error_log', async () => {
//   await request(server)
//     .get('/error_log')
//     .expect(200)
//     .expect('Content-Type', /json/)
//     .then(response => {
//        assert(response.body, {});
//    });
// });
//
// describe.skip('PUT /reboot', () => {
//   it('should return 200 when camera has attached', async () => {
//     await request(server)
//       .get('/reboot')
//       .expect(200)
//       .expect('Content-Type', /json/)
//       .then(response => {
//          assert(response.body.log.length, 1234);
//      });
//   });
// });
//
//
describe('POST /upgrade', () => {
  it('should return 200 when upgrade is is inititaed', async () => {
    await request(server)
      .post('/upgrade')
      .field('dry', true)
      .attach('pkg', 'test/fixtures/boxfish.pkg')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
         expect(response.body.message).toEqual('Upgrading in progress');
         const progressLink = response.body.links.progress;
         expect(progressLink.url).toEqual('upgrade/status');
     });
  });

  // it('should return get pkg from server if nothing has been provided', async () => {
  //   await request(server)
  //     .post('/upgrade')
  //     .expect(200)
  //     .expect('Content-Type', /json/)
  //     .then(response => {
  //        assert(response.body.message, 'Upgrading in progress');
  //        assert(response.body.links, '/upgrade/:id/state');
  //    });
  // });
  //
  // it('should return get pkg from specified channel server if nothing has been provided', async () => {
  //   await request(server)
  //     .post('/upgrade')
  //     .send({ channel: 'rc' })
  //     .expect(200)
  //     .expect('Content-Type', /json/)
  //     .then(response => {
  //        assert(response.body.message, 'Upgrading in progress');
  //        assert(response.body.links, '/upgrade/:id/state');
  //    });
  // });
});

describe('GET /upgrade/status', () => {
  it('should return 200 upgrade status when running', async () => {
    await request(server)
      .get('/upgrade/status')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
         expect(response.body.state).toEqual('completed');
     });
  });

  it.skip('should return 200 upgrade status when running', async () => {
    await request(server)
      .post('/upgrade')
      .attach('pkg', 'test/fixtures/boxfish.pkg')
      .expect(200)


     await new Promise((resolve, reject) => {
       const pollStatInterval = setInterval(function () {
         request(server)
         .get('/upgrade/status')
         .expect(200)
         .expect('Content-Type', /json/)
         .then(response => {
           if (response.body.state === 'completed') {
             clearInterval(pollStatInterval);
             resolve();
             return;
           } else if (response.body.state === 'failed') {
             clearInterval(pollStatInterval);
             reject('failed');
           }
           console.log(response.body.state);
         });
       }, 1000);
     })
  });
});



// //Should maybe be two settings, detections, on/off, framing: on/off
// describe.skip('GET /ai/settings', () => {});
// describe.skip('POST /ai/settings', () => {});
//
describe('GET /ai/objects', () => {
  it('should return 200 with detections', async () => {
    await request(server)
      .get('/ai/objects')
      .expect(200)
      .expect('Content-Type', /json/)
      .then(response => {
        expect(response.body.objects.length).toEqual(3);
        const firstPerson = response.body.objects[0];
         expect(firstPerson.type).toEqual('person');
         expect(firstPerson.bbox.x).not.toBeNull();
         expect(firstPerson.bbox.y).not.toBeNull();
         expect(firstPerson.bbox.width).not.toBeNull();
         expect(firstPerson.bbox.height).not.toBeNull();
         expect(firstPerson.confidence).toEqual(0.3);
     });
  });
});
