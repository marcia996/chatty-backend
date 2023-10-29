import { IReactionJob } from '@reactions/interfaces/reaction.interface';
import { UserCache } from '@services/redis/user.cache';
import { ReactionModel } from '@root/features/reactions/models/reaction.schema';
import { PostModel } from '@post/models/post.schema';
import { omit } from 'lodash';
import { IQueryReaction, IReactionDocument,} from '@reactions/interfaces/reaction.interface';
import { IUserDocument } from '@user/interfaces/user.interface';
import { IPostDocument } from '@post/interfaces/post.interface';
import { Helpers } from '@global/helpers/helpers';
import mongoose from 'mongoose';
const userCache: UserCache = new UserCache();
class ReactionService

{
  public async addReactionDataToDB(reactionData:IReactionJob):Promise<void>
  {
    const { postId, userTo, userFrom, username, type, previousReaction, reactionObject } = reactionData;
    let updatedReactionObject: IReactionDocument = reactionObject as IReactionDocument;
  // if we created the reaction firsttime,we donot need to worry about the id,
  // because we want to replace everythin including id, if there is previous reaction,
  // we wan to delete the id
    if (previousReaction) {
      updatedReactionObject = omit(reactionObject, ['_id']);
    }

    const updatedReaction: [IUserDocument, IReactionDocument, IPostDocument] = (await Promise.all([
      userCache.getUserFromCache(`${userTo}`),
      // when it's matched replace the previouseOne.
      // not matched.-create a new one when upsert is true
      ReactionModel.replaceOne({ postId, type: previousReaction, username }, updatedReactionObject, { upsert: true }),
      PostModel.findOneAndUpdate(
        { _id: postId },
        {// reactions object. property
          $inc: {
            [`reactions.${previousReaction}`]: -1,
            [`reactions.${type}`]: 1
          }
        },
        { new: true }
      )
    ])) as unknown as [IUserDocument, IReactionDocument, IPostDocument];

  }

  public async removeReactionDataFromDB(reactionData:IReactionJob):Promise<void>
  {
    const{postId,previousReaction,username}=reactionData;
    ReactionModel.deleteOne({postId,type:previousReaction,username});
    PostModel.updateOne({_id:postId},{$inc:{[`reactions.${previousReaction}`]:-1}},{new:true});
  }

  public async getPostReactions(query: IQueryReaction, sort: Record<string, 1 | -1>): Promise<[IReactionDocument[], number]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([{ $match: query }, { $sort: sort }]);
    return [reactions, reactions.length];
  }
  public async getSinglePostReactionByUsername(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), username: Helpers.firstLetterUppercase(username) } }
    ]);
    return reactions.length ? [reactions[0], 1] : [];
  }

  public async getReactionsByUsername(username: string): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { username: Helpers.firstLetterUppercase(username) } }
    ]);
    return reactions;
  }

}

export const reactionService:ReactionService= new ReactionService();
