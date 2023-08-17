import { IEmailJob } from '@user/interfaces/user.interface';
import { BaseQueue } from './base.queue';

import {emailWorker} from '@worker/email.worker';
class EmailQueue extends BaseQueue
{
  constructor()
  {
    super('emails');
    this.processJob('forgetPasswordEmail',5,emailWorker.addNotificationEmail);
    this.processJob('changePassword', 5, emailWorker.addNotificationEmail);
  }
  // still confuse about the addEmailJob method
  public addEmailJob(name:string,data:IEmailJob):void
  {
    this.addJob(name,data);
  }
}

export const emailQueue:EmailQueue= new EmailQueue();
