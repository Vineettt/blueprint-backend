import 'reflect-metadata';
import { serve } from '@hono/node-server';
import app from './app';
import { logger } from '@blueprint/logger';
import { config } from '@blueprint/config';

const port = config.server.port;

logger.info(`Server starting on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  const shutdownTimeout = config.server.shutdownTimeout;

  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, shutdownTimeout);

  try {
    server.close(() => {
      logger.info('Server closed successfully');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
