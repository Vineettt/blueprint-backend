import { createBoss } from '@blueprint/pg-boss';
import { logger } from '@blueprint/logger';
import { config } from '@blueprint/config';
import { emailConsumer } from './consumers/email.consumer';

const boss = createBoss(config.pgBoss.connectionString);

const startWorker = async () => {
  try {
    await boss.start();
    logger.info('PgBoss worker started');

    await boss.work('email', emailConsumer);

    logger.info('Workers registered successfully');
  } catch (error) {
    logger.error('Failed to start worker', { error });
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    await boss.stop();
    logger.info('Worker stopped successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

startWorker();
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
