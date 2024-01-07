import express, {Router} from 'express';
import { authMiddleware } from '@global/helpers/authe-middleware';
import { Add } from '@follower/controllers/follower-user';
import { Remove } from '@follower/controllers/unfollow-user';
import { Get } from '@follower/controllers/get-follower';

class FollowerRoutes{
   private router:Router;

   constructor()
   {
    this.router=express.Router();
   }

   public routes():Router
   {
    this.router.put('/user/follow/:followeeId',authMiddleware.checkAuthentication,Add.prototype.follower);
    this.router.put('/user/unfollow/:followeeId/:followerId',authMiddleware.checkAuthentication,Remove.prototype.follower);
    this.router.get('/user/following',authMiddleware.checkAuthentication,Get.prototype.userFollowing);
    this.router.get('/user/followers/:userId', authMiddleware.checkAuthentication, Get.prototype.userFollowers);
    return this.router;
   }
}

export const followerRoutes:FollowerRoutes= new FollowerRoutes();
