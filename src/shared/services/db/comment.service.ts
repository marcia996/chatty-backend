import { ICommentDocument, ICommentJob, ICommentNameList, IQueryComment } from '@comment/interfaces/comment.interface';
import { CommentsModel } from '@comment/models/comment.schema';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import mongoose, { Query } from 'mongoose';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
// import { NotificationModel } from '@notification/models/notification.schema';
// import { INotificationDocument, INotificationTemplate } from '@notification/interfaces/notification.interface';
// import { socketIONotificationObject } from '@sockets/notification';
// import { notificationTemplate } from '@services/emails/templates/notifications/notification-template';
// import { emailQueue } from '@service/queues/email.queue';

const userCache:UserCache= new UserCache();
class CommentService
{
   public async addCommentToDB(commentData:ICommentJob):Promise<void>
   {
    const {postId,userTo,userFrom,comment,username}=commentData;
    const comments:Promise<ICommentDocument>= CommentsModel.create(comment);
    // need two types of argument
    const post: Query<IPostDocument,IPostDocument> = PostModel.findOneAndUpdate(
      { _id: postId },
      { $inc: { commentsCount: 1 } },
      { new: true }
    ) as Query<IPostDocument,IPostDocument>;

    const user: Promise<IUserDocument> = userCache.getUserFromCache(userTo) as Promise<IUserDocument>;
    const response: [ICommentDocument, IPostDocument, IUserDocument] = await Promise.all([comments, post, user]);
   }

   public async getPostComments(query:IQueryComment,sort:Record<string,1|-1>):Promise<ICommentDocument[]>
    {
      const comments: ICommentDocument[] = await CommentsModel.aggregate([{ $match: query }, { $sort: sort }]);
      return comments;
    }

    public async getPostCommentNames(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentNameList[]> {
      const commentsNamesList: ICommentNameList[] = await CommentsModel.aggregate([
        { $match: query },
        { $sort: sort },
        { $group: { _id: null, names: { $addToSet: '$username' }, count: { $sum: 1 } } },
        { $project: { _id: 0 } }
      ]);
      return commentsNamesList;
    }
}
export const commentService: CommentService = new CommentService();
