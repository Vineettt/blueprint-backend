import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { swaggerUI } from '@hono/swagger-ui';
import { compress } from 'hono/compress';
import { requestId } from 'hono/request-id';
import routes from '@routes/index';
import authMiddleware from '@middleware/auth/auth.middleware';
import { maintenanceMiddleware } from '@middleware/system/maintenance.middleware';
import { corsMiddleware } from '@middleware/security/cors.middleware';
import { securityHeadersMiddleware } from '@middleware/security/security-headers.middleware';
import { loginRateLimit, apiRateLimit } from '@middleware/rate-limit';
import { errorHandler } from '@middleware/system/error-handler.middleware';
import { config } from '@blueprint/config';
import { serviceInjectionMiddleware } from '@middleware/di/service-injection.middleware';
import { zodValidationMiddleware } from '@middleware/validation/zod-validation.middleware';
import { ignoreKeyMiddleware } from '@middleware/validation/ignore-key.middleware';

const app = createOpenAPIRouter();

app.onError(errorHandler);

app.use('*', compress());
app.use('*', requestId());
app.use('*', corsMiddleware);
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.header('X-Response-Time', `${duration}ms`);
});
app.get('/', c => {
  return c.text('blueprint API');
});
app.use('*', securityHeadersMiddleware);
app.use('*', maintenanceMiddleware);
app.use('*', serviceInjectionMiddleware);
app.use('/api/*', zodValidationMiddleware());
app.use('/api/*', ignoreKeyMiddleware);
app.use('/api/*', authMiddleware);
app.use('/api/login', loginRateLimit);
app.use('/api/password/forgot', loginRateLimit);
app.use('/api/health', apiRateLimit);

app.route('/api', routes.healthRoutes);
app.route('/api', routes.authRoutes);
app.route('/api', routes.sessionRoutes);
app.route('/api', routes.accountRoutes);
app.route('/api', routes.passwordRoutes);
app.route('/api', routes.userStatusRoutes);
app.route('/api', routes.userRoutes);
app.route('/api', routes.roleRoutes);
app.route('/api', routes.routeRoutes);
app.route('/api', routes.roleRouteMappingRoutes);
app.route('/api', routes.userRoleMappingRoutes);

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'blueprint API',
    version: '1.0.0',
    description: 'blueprint backend API documentation',
  },
  servers: [
    {
      url: config.server.apiBaseUrl,
      description: 'API server',
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
});

app.openAPIRegistry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

app.get('/ui', swaggerUI({ url: '/doc' }));

export default app;
