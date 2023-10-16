import { Helpers } from './../../globals/helpers/helpers';
import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import {config} from '../../../config';
import { ISavePostToCache, IPostDocument } from '../../../features/post/interfaces/post.interface';
import { ServerError } from '../../globals/helpers/error-handler';
import {IReactions} from '../../../features/post/interfaces/post.interface';
// 引入 redisCommandRawReply
import {RedisCommandRawReply} from '@redis/client/dist/lib/commands';
const log:Logger= config.createLogger('postCache');
export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[];
export class PostCache extends BaseCache
{

  constructor()
  {
    super('postCache');
  }

   public async savePostToCache(data:ISavePostToCache):Promise<void>
   {
     const {key,currentUserId,uId,createdPost}=data;
     const{_id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount,
      imgVersion,
      imgId,
      reactions,
      createdAt}=createdPost;

      const firstList:string[]=[
           '_id',`${_id}`,
           'userId',`${userId}`,
           'username',`${username}`,
           'email',`${email}`,
           'avatarColor',`${avatarColor}`,
           'profilePicture',`${profilePicture}`,
           'post', `${post}`,
           'bgColor', `${bgColor}`,
           'feelings', `${feelings}`,
           'privacy', `${privacy}`,
           'gifUrl', `${gifUrl}`,
           ];

      const secondList:string[]=[
        'commentsCount', `${commentsCount}`,
        'reactions', JSON.stringify(reactions),
        'imgVersion', `${imgVersion}`,
        'imgId', `${imgId}`,
        'createdAt',`${createdAt}`
      ];

      const dataTosave:string[]=[...firstList,...secondList];
      try {
         if(!this.client.isOpen)
         {await this.client.connect();}
         // update the postsCount (see it from usershcema)
       const postCount:string[]= await this.client.HMGET(`users:${currentUserId}`,'postsCount');
       // whatever this client.multi() return  is for multi
       const multi:ReturnType <typeof this.client.multi>= this.client.multi();
       // key as a value to rank and details used HSET method to store// grammer
       multi.ZADD('post',{score:parseInt(uId,10),value:`${key}`});
       multi.HSET(`post:${key}`,dataTosave);
       //update the number of postcount
       const count:number= parseInt(postCount[0],10)+1;
       multi.HSET(`users:${currentUserId}`,['postCount',count]);
       multi.exec();
      } catch (error) {
              log.error(error);
              throw new ServerError('Server error,Try again');
      }
   }

   public async getPostsfromCache(key:string, start:number,end:number):Promise<IPostDocument[]>
   {  // return IPostDocument type array
      try
      {
        if(!this.client.isOpen)
        {
          await this.client.connect();
        }
        const reply:string[]= await this.client.ZRANGE(key,start,end,{REV:true});
        const multi:ReturnType<typeof this.client.multi>=this.client.multi();
        for(const value of reply)
        {
          multi.HGETALL(`post:${value}`);
        }
        const replies:PostCacheMultiType= (await multi.exec()) as PostCacheMultiType;
        const postReplies:IPostDocument[]=[];
        for(const post of replies as IPostDocument[])
        {
        post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
        postReplies.push(post);
        }
        return postReplies;
      }
      catch(error)
      {
        log.error(error);
        throw new ServerError('Server Error. Try again');
      }

   }

   public async getTotalPostsInCache():Promise<number>
   {
     try {

      if(!this.client.isOpen)
      { await this.client.connect();}
      const count:number= await this.client.ZCARD('post');
      return count;
     } catch (error) {
        log.error(error);
        throw new ServerError('Server Error. Try again');
     }
   }

   public async getPostsWithImagesFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postWithImages: IPostDocument[] = [];
      for (const post of replies as IPostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
          post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
          post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
          postWithImages.push(post);
        }
      }
      return postWithImages;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }


  // get post by each user // uid as start and end will get all the data related
  // to this particular UID
  public async getUserPostsFromCache(key: string, uId: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`post:${value}`);
      }
      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postReplies: IPostDocument[] = [];
      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
        postReplies.push(post);
      }
      return postReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

 // ZCOUNT with score between min and max
  public async getTotalUserPostsInCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCOUNT('post', uId, uId);
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }


  public async deletePostFromCache(key:string,currentUserId:string):Promise<void>
  {
    try
    {
      if(!this.client.isOpen)
      {
        await this.client.connect();
      }

      const postCount:string[]= await this.client.HMGET(`users:${currentUserId}`,'postsCount');
      // whatever this client.multi() return  is for multi
      const multi:ReturnType <typeof this.client.multi>= this.client.multi();
      // delete post set
      multi.ZREM('post',`${key}`);
      multi.DEL(`post:${key}`);
      // 改回usercount
      const count: number = parseInt(postCount[0], 10) - 1;
      multi.HSET(`users:${currentUserId}`, 'postsCount', count);
      await multi.exec();
    }
    catch(error)
    {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }


  public async updatePostInCache(key:string,updatedPost:IPostDocument):Promise<IPostDocument>
  {
    const{post,bgColor,feelings,privacy,gifUrl,imgVersion,imgId,profilePicture}=updatedPost;
    const firstList:string[]=[
      'post', `${post}`,
      'bgColor', `${bgColor}`,
      'feelings', `${feelings}`,
      'privacy', `${privacy}`,
      'gifUrl', `${gifUrl}`,
      ];
    const secondList:string[]=[
      'profilePicture', `${profilePicture}`,
      'imgVersion', `${imgVersion}`,
      'imgId', `${imgId}`,
    ];
    const dataToSave:string[]=[...firstList,...secondList];
    try{
       if(!this.client.isOpen)
       {
        await this.client.connect();
       }
      await this.client.HSET(`post:${key}`,dataToSave);
      const multi:ReturnType <typeof this.client.multi>= this.client.multi();
      multi.HGETALL(`post:${key}`);
      const reply:PostCacheMultiType=await multi.exec() as PostCacheMultiType;
      const postReply= reply as IPostDocument[];
      postReply[0].commentsCount = Helpers.parseJson(`${postReply[0].commentsCount}`) as number;
      postReply[0].reactions = Helpers.parseJson(`${postReply[0].reactions}`) as IReactions;
      postReply[0].createdAt = new Date(Helpers.parseJson(`${postReply[0].createdAt}`)) as Date;

      return postReply[0];
    }
    catch(error)
    {
      log.error(error);
      throw new ServerError('Server Error. Try again');
    }
  }
}
