import { z } from 'zod';

export const emailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

export const reportJobSchema = z.object({
  userId: z.string(),
  reportType: z.enum(['daily', 'weekly', 'monthly']),
});

export type EmailJob = z.infer<typeof emailJobSchema>;
export type ReportJob = z.infer<typeof reportJobSchema>;
