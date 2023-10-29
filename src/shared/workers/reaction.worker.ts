
import { DoneCallback,Job } from 'bull';
import{reactionService} from '@services/db/reaction.service';
import Logger from 'bunyan';
import {config} from '@root/config';

const log:Logger= config.createLogger('reactionWorker');
class ReactionWoker
{
  async addReactionToDB(job:Job,done:DoneCallback):Promise<void>{
    try {

      const {data}=job;
      await reactionService.addReactionDataToDB(data);
      job.progress(100);
      done(null,data);

    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  async removeReactionFromDB(job:Job,done:DoneCallback):Promise<void>
  {
    try {

      const {data}=job;
      await reactionService.removeReactionDataFromDB(data);
      job.progress(100);
      done(null,data);

    } catch (error) {
       log.error(error);
       done(error as Error);
    }
  }

}

export const reactionWorker:ReactionWoker= new ReactionWoker();
