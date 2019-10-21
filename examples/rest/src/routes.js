
import Router from 'koa-router';
import fs from 'fs';

const camera = require('./controllers/camera');

const router = new Router();

/**
 * GET /
 */
router.get('/info', async (ctx) => {
  try {
    ctx.body = await camera.getInfo();
  } catch (e) {
    ctx.throw(404, {
      error_message: e.message
    });
  }
});

router.put('/detector/start', async (ctx) => {
  try {
    ctx.body = await camera.startAutozoom();
  } catch (e) {
    ctx.throw(404, {
      error_message: e.message
    });
  }
});


router.put('/detector/stop', async (ctx) => {
  try {
    ctx.body = await camera.stopAutozoom();
  } catch (e) {
    ctx.throw(404, {
      error_message: e.message
    });
  }
});

router.get('/detector/detections', async (ctx) => {
  try {
    ctx.body = await camera.detect();
  } catch (e) {
    ctx.throw(404, {
      error_message: e.message
    });
  }
});

router.post('/upgrade', async (ctx) => {
  try {
    const { file } = ctx.request.files;
    if (!file) {
      throw new Error('No file uploaded');
    }
    const fileBuffer = fs.readFileSync(file.path);
    camera.upgrade({
      file: fileBuffer
    });
    ctx.body = {
      message: "Upgrading in progress",
      links: {
        "progress": {
          url: "upgrade/status"
        }
      }
    }
  } catch (e) {
    if (e instanceof RangeError){
      ctx.throw(400, {
        error_message: e.message
      });
    } else {
      ctx.throw(404, {
        error_message: e.message
      });
    }
  }
});

router.get('/upgrade/status', async (ctx) => {
  try {
    ctx.body = camera.getUpgradeStatus();
  } catch (e) {
    ctx.throw(404, {
      error_message: e.message
    });
  }
});

export default router;
