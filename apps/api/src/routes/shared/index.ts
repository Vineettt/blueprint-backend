import healthRoutes from './health.routes';
import userRoutes from './user.routes';
import userStatusRoutes from './user-status.routes';

const sharedRouteExports = {
  healthRoutes,
  userRoutes,
  userStatusRoutes,
};

export default sharedRouteExports;
