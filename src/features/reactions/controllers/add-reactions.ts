
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { addReactionSchema } from '@reactions/schemes/reactions';
import { IReactionDocument, IReactionJob } from '@reactions/interfaces/reaction.interface';
import { ReactionCache } from '@services/redis/reaction.caches';
import { reactionQueue } from '@services/queues/reaction.queue';
const reactionCache:ReactionCache= new ReactionCache();

export class Add
{

  @joiValidation(addReactionSchema)
  public async reaction(req:Request,res:Response):Promise<void>
  {
    const{userTo,postId,type,previousReaction,postReactions,profilePicture}=req.body;

    const reactionObject:IReactionDocument=
    {
      _id:new ObjectId(),// this id will be conflicted with mongodb id 
      postId,
      type,
      avataColor:req.currentUser!.avatarColor,
      username:req.currentUser!.username,
      profilePicture

    } as IReactionDocument;

    await reactionCache.savePostReactionToCache(postId,reactionObject,postReactions,type,previousReaction);

    const databaseReactionData:IReactionJob={
      postId,
      userTo,
      userFrom:req.currentUser!.userId,
      username:req.currentUser!.username,
      type,
      previousReaction,
      reactionObject,
    } as IReactionJob;
    // just pass databaseReactionData as object
    reactionQueue.addReactionJob('addReactionToDB',databaseReactionData);

    res.status(HTTP_STATUS.OK).json({message:'Reaction added succesfully'});
  }

}
