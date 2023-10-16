import  HTTP_STATUS from 'http-status-codes';
//是的，确实有可能。我之前的解释是基于常见的客户端到服务器的通信模式，但Socket.io同样支持服务器到客户端的通信。

import { socketIOPostObject } from '@sockets/post';
import { PostCache } from '@services/redis/post.cache';
//如果socketIOPostObject是在服务器端的Socket.io实例，并且这段代码是在服务器上执行的，那么这段代码的意思是：服务器正在向连接的客户端发送一个名为'delete post'的事件，并附带了req.params.postId作为数据。

//在这种情况下，客户端需要监听'delete post'事件，并在接收到此事件时采取适当的行动，例如从用户界面中删除指定的帖子。

import { Request,Response } from 'express';
import { postQueue } from '@services/queues/post.queue';

const postCache= new PostCache();
export class Delete
{
  public async post(req:Request, res:Response):Promise<void>
  {
    socketIOPostObject.emit('delete post',req.params.postId);
    await postCache.deletePostFromCache(req.params.postId,`${req.currentUser!.userId}}`);
    postQueue.addPostJob('deletePostFromDB',{keyOne:req.params.postId,keyTwo:req.currentUser!.userId});
    res.status(HTTP_STATUS.OK).json({message:'Post deleted successfully'});

  }
}
