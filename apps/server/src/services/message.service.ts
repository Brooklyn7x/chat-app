import Redis from "ioredis";
import { DatabaseService } from "./database.service";
import {
  CreateMessageDTO,
  Message,
  MessageStatus,
  MessageType,
} from "../types/message";
import { ServiceResponse } from "../types/service-respone";
import { BaseService } from "./base.service";
import mongoose from "mongoose";
import { MessageModel } from "../models/message.model";
import { send } from "process";

export class MessageService extends BaseService {
  private redis: Redis;
  private db: DatabaseService;

  constructor() {
    super("MessageService");
    this.redis = new Redis(process.env.REDIS_URL as string);
    this.db = new DatabaseService();
  }

  async sendMessage(
    senderId: string,
    messageData: CreateMessageDTO
  ): Promise<ServiceResponse<any>> {
    try {
      const message: Message = {
        id: crypto.randomUUID(),
        senderId: new mongoose.Types.ObjectId(senderId).toString(),
        receiverId: messageData.receiverId,
        conversationId: messageData.conversationId,
        content: messageData.content,
        type: messageData.type,
        status: MessageStatus.SENDING,
        timestamp: new Date(),
      };

      console.log("sending message:", message);

      await this.cacheMessage(message);
      const storedMessage = await MessageModel.create(message);
      // message.status = MessageStatus.SENT;
      // await this.updateMessageStatus(message.id, MessageStatus.SENT);
      // await this.sendRealTimeUpdate(message);
      // await this.updateConversation(message);

      return {
        success: true,
        data: storedMessage,
      };
    } catch (error) {
      this.logger.error("Error creating message:", error);
      return {
        success: false,
        error: "Failed to create message",
      };
    }
  }

  async getMessages(
    conversationId: string,
    limit: number = 20,
    before?: Date
  ): Promise<ServiceResponse<any[]>> {
    try {
      const cacheKey = `messages:${conversationId}`;
      const cacheMessage = await this.getCacheMessage(cacheKey, limit);
      if (cacheMessage.length === limit) {
        return {
          success: true,
          data: cacheMessage,
        };
      }

      const query = before
        ? { conversationId, timestamp: { $lt: before } }
        : { conversationId };

      const message = await this.db.find("Message", query, {
        sort: { timestamp: -1 },
        limit,
      });

      console.log("fetched messages:", message);

      // await this.cacheMessage(message);

      return {
        success: true,
        data: message,
      };
    } catch (error) {
      this.logger.error("Error fetching messages:", error);
      return {
        success: false,
        error: "Failed to fetch messages",
      };
    }
  }

  async deleteMessage(messageId: string, userId: string) {
    try {
      const message = await MessageModel.findOne({
        _id: new mongoose.Types.ObjectId(messageId).toString(),
        senderId: new mongoose.Types.ObjectId(userId).toString(),
      });

      if (!message) {
        return {
          success: false,
          error: "Message not found",
        };
      }

      const deleteMessage = await MessageModel.deleteOne({
        _id: new mongoose.Types.ObjectId(messageId).toString(),
      });
      if (!deleteMessage.deletedCount) {
        return {
          success: false,
          error: "Failed to delete message",
        };
      }
      // await this.redis.del(`message:${messageId}`);
      return {
        success: true,
      };
    } catch (error) {
      this.logger.error("Error deleting message:", error);
      return {
        success: false,
        error: "Failed to delete message",
      };
    }
  }

  private async cacheMessage(message: any): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.hset(`message:${message.id}`, this.serializeMessage(message));
    pipeline.zadd(
      `message:${message.conversationId}`,
      message.timestamp.getTime(),
      message.id
    );
    pipeline.expire(`message:${message.id}`, 86400);
    pipeline.expire(`message:${message.conversationId}`, 86400);
    await pipeline.exec();
  }

  private async getCacheMessage(
    conversationId: string,
    limit: number
  ): Promise<Message[]> {
    const messageIds = await this.redis.zrevrange(
      `message:${conversationId}`,
      0,
      limit - 1
    );
    const message = await Promise.all(
      messageIds.map(async (id) => {
        const messageData = await this.redis.hgetall(`message:${id}`);
        return this.deserializeMessage(messageData);
      })
    );

    return message.filter(Boolean);
  }

  private serializeMessage(message: Message): Record<string, string> {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      type: message.type,
      status: message.status,
      timestamp: message.timestamp ? message.timestamp.toISOString() : "",
      metadata: message.metadata ? JSON.stringify(message.metadata) : "",
    };
  }

  private deserializeMessage(data: Record<string, string>): Message {
    return {
      id: data.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      type: data.type as MessageType,
      status: data.status as MessageStatus,
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
    };
  }
}
