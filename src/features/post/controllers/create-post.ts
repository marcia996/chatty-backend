
import { joiValidation } from '../../../shared/globals/decorators/joi-validation.decorators';
import { postSchema, postWithImageSchema,} from '../schemes/post.schemes';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { IPostDocument } from '../interfaces/post.interface';
import { UploadApiResponse } from 'cloudinary';
import { PostCache } from '../../../shared/services/redis/post.cache';
import { socketIOPostObject } from '../../../shared/sockets/post';
import { postQueue } from '../../../shared/services/queues/post.queue';
import { uploads } from '../../../shared/globals/helpers/cloudinary-upload';
import { BadRequestError } from '../../../shared/globals/helpers/error-handler';
const postCache:PostCache= new PostCache();
export class Create {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body;
    const postObjectId: ObjectId = new ObjectId();
    const createdPost:IPostDocument= {
     _id:postObjectId,
     userId:req.currentUser!.userId,
     username:req.currentUser!.username,
     email:req.currentUser!.email,
     avatarColor:req.currentUser!.avatarColor,
     profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as IPostDocument;

     await postCache.savePostToCache({key:postObjectId,currentUserId:`${req.currentUser!.userId}`,
     uId:`${req.currentUser!.uId}`,createdPost});

     //emit the event,once we got to the client part, we can just listen for
     // the event
     socketIOPostObject.emit('add post',createdPost);

     // save data to mongodb
     postQueue.addPostJob('addPostToDB',{key:req.currentUser!.userId,value:createdPost});
    res.status(HTTP_STATUS.CREATED).json({message:'Post created successfully'});
  }

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } = req.body;
   // whatever the cloudinary sent, sent to the user
   // allow cloudinary to generate id and version for us
    const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const postObjectId: ObjectId = new ObjectId();
      const createdPost:IPostDocument= {
       _id:postObjectId,
       userId:req.currentUser!.userId,
       username:req.currentUser!.username,
       email:req.currentUser!.email,
       avatarColor:req.currentUser!.avatarColor,
       profilePicture,
        post,
        bgColor,
        feelings,
        privacy,
        gifUrl,
        commentsCount: 0,
        imgVersion:result.version.toString(),
        imgId:result.public_id,
        createdAt: new Date(),
        reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
      } as IPostDocument;
      // Cannot read properties of undefined (reading 'emit')
      // socketIOPostObject=io has to be added to the socket io
     socketIOPostObject.emit('add post image', createdPost);
    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    });
    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });
    // add image to the new collection
    // call image queue to add image to mongodb database
    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created with image successfully' });
  }

  // @joiValidation(postWithVideoSchema)
  // public async postWithVideo(req: Request, res: Response): Promise<void> {
  //   const { post, bgColor, privacy, gifUrl, profilePicture, feelings, video } = req.body;

  //   const result: UploadApiResponse = (await videoUpload(video)) as UploadApiResponse;
  //   if (!result?.public_id) {
  //     throw new BadRequestError(result.message);
  //   }

  //   const postObjectId: ObjectId = new ObjectId();
  //   const createdPost:IPostDocument= {
  //     _id:postObjectId,
  //     userId:req.currentUser!.userId,
  //     username:req.currentUser!.username,
  //     email:req.currentUser!.email,
  //     avatarColor:req.currentUser!.avatarColor,
  //     profilePicture,
  //      post,
  //      bgColor,
  //      feelings,
  //      privacy,
  //      gifUrl,
  //      commentsCount: 0,
  //      imgVersion: '',
  //      imgId: '',
  //      createdAt: new Date(),
  //      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
  //    } as IPostDocument;
  //   socketIOPostObject.emit('add post', createdPost);
  //   await postCache.savePostToCache({
  //     key: postObjectId,
  //     currentUserId: `${req.currentUser!.userId}`,
  //     uId: `${req.currentUser!.uId}`,
  //     createdPost
  //   });
  //   postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });
  //   res.status(HTTP_STATUS.CREATED).json({ message: 'Post created with video successfully' });
  // }
};
