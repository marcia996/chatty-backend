import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { FollowerCache } from '@services/redis/follower.cache';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { IFollowerData } from '@follower/interfaces/follower.interface';
import mongoose from 'mongoose';
import { socketIOFollowerObject } from '@sockets/follower';
import { followerQueue } from '@services/queues/follower.queue';
// import { followerQueue } from '@services/queues/follower.queue';

const followerCache: FollowerCache = new FollowerCache();
const userCache: UserCache = new UserCache();


export class Add{
  public async follower(req:Request,res:Response):Promise<void>
  {
    const {followeeId}=req.params;
    const followersCount:Promise<void>=followerCache.updateFollowersCountInCache(`${followeeId}`,'followersCount',1);
    const followeeCount:Promise<void>= followerCache.updateFollowersCountInCache(`${req.currentUser!.userId}`,'followingCount',1);
    await Promise.all([followersCount,followeeCount]);


    const cachedFollower:Promise<IUserDocument>=userCache.getUserFromCache(followeeId) as Promise<IUserDocument>;
    const cachedFollowee:Promise<IUserDocument>=userCache.getUserFromCache(`${req.currentUser!.userId}`) as Promise<IUserDocument>;
    const response :[IUserDocument,IUserDocument]=await Promise.all([cachedFollower,cachedFollowee]);

    const followerObjectId:ObjectId= new ObjectId();
    const addFolloweeData: IFollowerData = Add.prototype.userData(response[0]);
    socketIOFollowerObject.emit('add follower', addFolloweeData);

    const addFolloweeToCache:Promise<void>=followerCache.saveFollowerToCache(`followers:${followeeId}`,`${req.currentUser!.userId}`);
    const addFollowerToCache:Promise<void>=followerCache.saveFollowerToCache(`following:${req.currentUser!.userId}`,`${followeeId}`);
    await Promise.all([addFollowerToCache,addFolloweeToCache]);

    followerQueue.addFollowerJob('addFollowerToDB', {
      keyOne: `${req.currentUser!.userId}`,
      keyTwo: `${followeeId}`,
      username: req.currentUser!.username,
      followerDocumentId: followerObjectId
    });


    res.status(HTTP_STATUS.OK).json({message:'Following user now'});
  }

  private userData(user: IUserDocument): IFollowerData {
    return {
      _id: new mongoose.Types.ObjectId(user._id),
      username: user.username!,
      avatarColor: user.avatarColor!,
      postCount: user.postsCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      profilePicture: user.profilePicture,
      uId: user.uId!,
      userProfile: user
    };

  }
}
