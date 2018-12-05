import Koa from 'koa';
import cors from '@koa/cors';
import logger from 'koa-morgan';
import koaBody from 'koa-body';
import router from './routes';

const app = new Koa();

// Set middlewares
app.use(
  koaBody({
    multipart: true,
  })
);

// Logger
app.use(
  logger('dev', {
    skip: () => app.env === 'test'
  })
);

// Enable CORS
app.use(cors());

// Default error handler middleware
app.use(async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404) {
      ctx.throw(404);
    }
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      statusCode: ctx.status,
      error_message: err.error_message
    };
    ctx.app.emit('error', err, ctx);
    // throw err;
  }
});

// Routes
app.use(router.routes());
export default app;
