import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { authService } from '@services/db/auth.service';

const log: Logger = config.createLogger('authWorker');

class AuthWorker {
  async addAuthUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      // 解构job里的数据
      const { value } = job.data;
      // 把数据添加到mongodb中
      await authService.createAuthUser(value);
      // 更新任务的进度
      job.progress(100);
      // 任务完成
      done(null, job.data);
    } catch (error) {
      // 任务出错
      log.error(error);
      done(error as Error);
    }
  }
}

export const authWorker: AuthWorker = new AuthWorker();
