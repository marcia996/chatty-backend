
import { followerQueue } from '@services/queues/follower.queue';
import { FollowerCache } from '@services/redis/follower.cache';
import HTTP_STATUS from 'http-status-codes';
import {Request, Response} from 'express';

const followerCache:FollowerCache= new FollowerCache();
export class Remove
{
    public async follower(req:Request,res:Response):Promise<void>
    {
        const {followeeId, followerId}=req.params;

        const removeFollowerFromCache:Promise<void>=followerCache.removeFollowerFromCache(
            `following:${req.currentUser!.userId}`,followeeId
        );
        
        const removeFolloweeFromCache:Promise<void>=followerCache.removeFollowerFromCache
        (`followers:${followeeId}`,followerId);

        const followersCount:Promise<void>=followerCache.updateFollowersCountInCache(`${followeeId}`,'followesCount',-1);
        const followeeCount:Promise<void>=followerCache.updateFollowersCountInCache(`${followerId}`,'followingCount',-1);

        followerQueue.addFollowerJob('removeFollowerFromDB',
        {
            keyOne:`${followeeId}`,
            keyTwo:`${followerId}`
        });
         
        res.status(HTTP_STATUS.OK).json({message:'Unfollower user now'});
    }
}