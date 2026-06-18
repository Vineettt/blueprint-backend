import { z } from 'zod';

export const healthCheckSchema = z.object({
  status: z.enum(['ok', 'error', 'maintenance']),
  service: z.string().min(1, 'Service name is required'),
  timestamp: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const serviceStatusSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  responseTime: z.number().min(0, 'Response time must be positive').optional(),
  lastCheck: z.string(),
  error: z.string().optional(),
});

export const systemInfoSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  environment: z.enum(['development', 'staging', 'production']),
  uptime: z.number().min(0, 'Uptime must be positive'),
  memory: z.object({
    used: z.number().min(0),
    total: z.number().min(0),
    percentage: z.number().min(0).max(100),
  }),
  cpu: z.object({
    usage: z.number().min(0).max(100),
    cores: z.number().min(1),
  }),
});

export const healthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  timestamp: z.string(),
});

export const healthErrorResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  timestamp: z.string(),
  error: z.string(),
});

export type HealthCheckInput = z.infer<typeof healthCheckSchema>;
export type ServiceStatusInput = z.infer<typeof serviceStatusSchema>;
export type SystemInfoInput = z.infer<typeof systemInfoSchema>;
