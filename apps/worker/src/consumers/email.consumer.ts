import { logger } from '@blueprint/logger';
import { emailJobSchema, type EmailJob, type Job } from '@blueprint/pg-boss';

export const emailConsumer = async (job: Job<EmailJob>) => {
  try {
    const validatedData = emailJobSchema.parse(job.data);

    logger.info(`Processing email job: ${validatedData.subject}`);

    logger.info('Email job completed successfully');
  } catch (error) {
    logger.error('Email job failed', { error });
    throw error;
  }
};
