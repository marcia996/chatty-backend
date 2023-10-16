import { authMiddleware } from './shared/globals/helpers/authe-middleware';
import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentRoutes';
import { serverAdapter } from '@services/queues/base.queue';
import { Application } from 'express';
import {postRoutes} from '@post/routes/postRoutes';
// base path
const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    // used for queue
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());

     //check if the token exists
    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());

    // cannot create the route if not verify
    // verify user first if not, it will show token is not available
    app.use(BASE_PATH, authMiddleware.verifyUser,postRoutes.routes());
  };
  routes();
};
