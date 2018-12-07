import { name, version } from '../package.json';
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
    if (e instanceof camera.SDK.CameraNotFoundError) {
      ctx.throw(404, {
        error_message: e.message
      });
    } else {
      throw e;
    }
  }
});


router.put('/detector/start', async (ctx) => {
  try {
    ctx.body = await camera.startAutozoom();
  } catch (e) {
    if (e instanceof camera.SDK.CameraNotFoundError) {
      ctx.throw(404, {
        error_message: e.message
      });
    } else {
      throw e;
    }
  }
});


router.put('/detector/stop', async (ctx) => {
  try {
    ctx.body = await camera.stopAutozoom();
  } catch (e) {
    if (e instanceof camera.SDK.CameraNotFoundError) {
      ctx.throw(404, {
        error_message: e.message
      });
    } else {
      throw e;
    }
  }
});

router.get('/detector/detections', async (ctx) => {
  try {
    ctx.body = await camera.detect();
  } catch (e) {
    if (e instanceof camera.SDK.CameraNotFoundError) {
      ctx.throw(404, {
        error_message: e.message
      });
    } else {
      throw e;
    }
  }
});

router.get('/ptz', async (ctx) => {
  try {
    ctx.body = await camera.getPtz();
  } catch (e) {
    if (e instanceof camera.SDK.CameraNotFoundError) {
      ctx.throw(404, {
        error_message: e.message
      });
    } else {
      throw e;
    }
  }
});

router.post('/ptz', async (ctx) => {
  try {
    ctx.body = await camera.setPtz(ctx.request.body);
  } catch (e) {
    if (e instanceof camera.SDK.CameraNotFoundError) {
      ctx.throw(404, {
        error_message: e.message
      });
    } else if (e instanceof RangeError){
      ctx.throw(400, {
        error_message: e.message
      });
    } else {
      throw e;
    }
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
    if (e instanceof camera.SDK.CameraNotFoundError) {
      ctx.throw(404, {
        error_message: e.message
      });
    } else if (e instanceof RangeError){
      ctx.throw(400, {
        error_message: e.message
      });
    } else {
      throw e;
    }
  }
});

router.get('/upgrade/status', async (ctx) => {
  try {
    ctx.body = camera.getUpgradeStatus();
  } catch (e) {
    if (e instanceof camera.SDK.CameraNotFoundError) {
      ctx.throw(404, {
        error_message: e.message
      });
    } else {
      throw e;
    }
  }
});

export default router;
