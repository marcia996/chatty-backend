import { UploadApiResponse } from 'cloudinary';

import { Request, Response } from 'express';
import { PostCache } from '@services/redis/post.cache';
import HTTP_STATUS from 'http-status-codes';
import { postQueue } from '@services/queues/post.queue';
import { socketIOPostObject } from '@sockets/post';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { postSchema,postWithImageSchema } from '@post/schemes/post.schemes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';


const postCache: PostCache = new PostCache();

export class Update {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl,profilePicture } = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
    } as IPostDocument;

    const postUpdated: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
    socketIOPostObject.emit('update post', postUpdated, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });
    res.status(HTTP_STATUS.OK).json({ message: 'Post updated successfully' });
  }


  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { imgId, imgVersion } = req.body;
    if (imgId && imgVersion) {
      Update.prototype.updatePost(req);
    } else {
      const result: UploadApiResponse = await Update.prototype.addImageToExistingPost(req);
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }
    }
    res.status(HTTP_STATUS.OK).json({ message: 'Post with image updated successfully' });
  }


  private async updatePost(req: Request): Promise<void> {
    const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture} = req.body;
    const { postId } = req.params;
    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId: imgId ? imgId : '',
      imgVersion: imgVersion ? imgVersion : '',
    } as IPostDocument;

    const postUpdated: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
    socketIOPostObject.emit('update post', postUpdated, 'posts');
    postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });
  }

  // second case after creating a post without an image and the user want to add a new image
  // we do not need the image id but need the image property


     private async addImageToExistingPost(req:Request):Promise<UploadApiResponse>
     {
       const {post,bgColor,feelings,privacy,gifUrl,profilePicture,image}=req.body;
       const{postId}=req.params;
       const result:UploadApiResponse=(await uploads(image)) as UploadApiResponse;
       if(!result?.public_id)
       {
        return result;
       }

       const updatedPost: IPostDocument = {
        post,
        bgColor,
        privacy,
        feelings,
        gifUrl,
        profilePicture,
        imgId: image ? result.public_id : '',
        imgVersion: image ? result.version.toString() : '',
      } as IPostDocument;
      const postUpdated: IPostDocument = await postCache.updatePostInCache(postId, updatedPost);
      socketIOPostObject.emit('update post', postUpdated, 'posts');
      postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });
      return result;
     }

    }


