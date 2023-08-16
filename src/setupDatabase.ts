import mongoose from 'mongoose';
import { config } from './config';
import logger from 'bunyan';
import { redisConnection } from '@services/redis/redis.connection';

const log: logger = config.createLogger('setupDatabase');

export default () => {
  const connect = () => {
    mongoose
      .connect(`${config.DATABASE_URL}`)
      .then(() => {
        log.info('connect to database');
        redisConnection.connect();
      })
      .catch((error) => {
        log.error('error connecting to database', error);
        return process.exit();
      });
  };
  connect();

  mongoose.connection.on('disconnected', connect);
};
