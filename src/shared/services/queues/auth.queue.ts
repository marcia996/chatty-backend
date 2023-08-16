import { IAuthJob } from '@auth/interfaces/auth.interfaces';
import { BaseQueue } from '@services/queues/base.queue';
import { authWorker } from '@worker/auth.worker';

class AuthQueue extends BaseQueue {
  constructor() {
    super('auth');
    // 当任务的name和'addAuthUserToDB' match的时候调用 authWorker.addAuthUserToDB函数
    this.processJob('addAuthUserToDB', 5, authWorker.addAuthUserToDB);
  }

  public addAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }
}

export const authQueue: AuthQueue = new AuthQueue();
