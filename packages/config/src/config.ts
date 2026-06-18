import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const getRequiredEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config = {
  jwt: {
    secret: getRequiredEnv('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '900'),
    refreshTokenExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800'),
  },
  email: {
    enabled: process.env.EMAIL_ENABLED !== 'false',
    from: process.env.EMAIL_FROM,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'ses') || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    ses: {
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  },
  database: {
    authDb: process.env.DB_AUTH_URL,
    pbacDb: process.env.DB_PBAC_URL,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    store: (process.env.RATE_LIMIT_STORE as 'memory' | 'redis') || 'memory',
  },
  redis: {
    clusterEnabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    clusterNodes: process.env.REDIS_CLUSTER_NODES || '',
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    corsOrigin:
      process.env.CORS_ORIGIN?.split(',')
        .map(o => o.trim())
        .filter(Boolean) || '*',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    shutdownTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT || '30000'),
  },
  cache: {
    routeCacheEnabled: process.env.ENABLE_ROUTE_CACHE !== 'false',
  },
  pgBoss: {
    connectionString: process.env.PGBOSS_CONNECTION_STRING || '',
  },
};
