import pino from 'pino';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = pino({
  level,
  redact: {
    paths: ['req.headers.authorization', 'password', 'token', '*.card', '*.cvv'],
    censor: '***',
  },
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' },
  },
});

export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    }, 'request');
  });
  next();
};


