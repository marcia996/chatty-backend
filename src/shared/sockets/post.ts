import { IReactionDocument } from '@reactions/interfaces/reaction.interface';
import { ICommentDocument } from '@comment/interfaces/comment.interface';
import {Server,Socket} from 'socket.io';

export let socketIOPostObject:Server;

export class SocketIOPostHandler
{
  private io:Server;
  constructor(io:Server)
  {
    this.io=io;
    socketIOPostObject=io;
  }
 // to listen for an event coming from the clients we use sockets dot on
 // send back the reaction using io.emit
  public listen():void
  {
    this.io.on('connection',(socket:Socket)=>{
      socket.on('reaction',(reaction:IReactionDocument)=>{
        this.io.emit('update like',reaction); // every client using update like all connected socket
      });

      socket.on('comment',(data:ICommentDocument)=>{
        this.io.emit('update comment',data);
      });
    });
  }
}
