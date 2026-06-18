import authRoutes from './auth';
import pbacRoutes from './pbac';
import sharedRoutes from './shared';

const routes = {
  ...authRoutes,
  ...pbacRoutes,
  ...sharedRoutes,
};

export default routes;
