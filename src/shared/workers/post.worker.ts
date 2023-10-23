
import {Job,DoneCallback} from 'bull';
import Logger from 'bunyan';
import {config} from '../../config';
import { postService } from '../services/db/post.service';

const log:Logger= config.createLogger('postWorker');

class PostWorker
{
  async savePostToDB(job:Job,done:DoneCallback):Promise<void>
  {
    try{
      const {key,value}=job.data;
      await postService.addPostToDB(key,value);
      job.progress(100);
      done(null,job.data);
    }
    catch(error)
    {
      log.error(error);
      done(error as Error);
    }
  }

  async deletePostFromDB(job:Job,done:DoneCallback):Promise<void>
  {
    try
    {
       const{keyone,keytwo}=job.data;
       await postService.deletePost(keyone,keytwo);
       job.progress(100);
       done(null,job.data);

    }
    catch(error)
    {
      log.error(error);
      done(error as Error);
    }
  }

  async updatePostInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await postService.editPost(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

}

export const postWorker:PostWorker= new PostWorker();
