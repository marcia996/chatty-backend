import { authMiddleware } from './shared/globals/helpers/authe-middleware';
import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentRoutes';
import { serverAdapter } from '@services/queues/base.queue';
import { Application } from 'express';
// base path
const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    // used for queue
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());

    // check if the token exists
    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
  };
  routes();
};
