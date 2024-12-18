import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { UserService } from "./user.service";
import { MessageService } from "./message.service";
import { UserStatus } from "../types/user.types";
import Logger from "../utils/logger";
import { io } from "../utils/socket";
import { BaseService } from "./base.service";

export class SocketService extends BaseService {
  private static instance: SocketService;
  private authService: AuthService;
  private messageService: MessageService;
  private userService: UserService;

  constructor() {
    super("SocketService");
    this.messageService = new MessageService();
    this.authService = new AuthService();
    this.userService = new UserService();
    BaseService.setSocketService(this);
    this.setUpSocketHandler();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private setUpSocketHandler() {
    io.use(this.authenticateSocket.bind(this));
    io.on("connection", this.handleSocketConnection.bind(this));
  }

  private async authenticateSocket(
    socket: Socket,
    next: (err?: Error) => void
  ) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("No authentication token"));
      }

      const validation = await this.authService.validateToken(token);
      if (!validation.success) {
        return next(new Error("Invalid authentication token"));
      }

      socket.data.userId = validation.data!.userId;
      next();
    } catch (error) {
      this.logger.error("Socket Authentication Error", error);
      next(new Error("Authentication process failed"));
    }
  }

  private async handleConnection(socket: Socket): Promise<void> {
    const userId = socket.data.userId;

    try {
      socket.join(`user:${userId}`);

      await this.userService.updateUserStatus(userId, UserStatus.ONLINE);

      this.setupChatHandlers(socket);
      this.setupTypingHandlers(socket);

      socket.on("disconnect", async () => {
        await this.handleDisconnect(socket);
      });

      this.logger.info(`User ${userId} connected`);
    } catch (error) {
      this.logger.error(`Connection error for user ${userId}:`, error);
    }
  }

  private async handleSocketConnection(socket: Socket) {
    const userId = socket.data.userId;

    // Implement connection tracking
    this.logger.info(`Socket Connection Attempt: ${userId}`);

    try {
      // Consolidated connection logic
      await this.initializeUserConnection(socket);
    } catch (error) {
      this.logger.error(
        `Connection Initialization Failed for User ${userId}`,
        error
      );
      socket.disconnect(true);
    }
  }

  private async initializeUserConnection(socket: Socket) {
    const userId = socket.data.userId;

    // Atomic connection setup
    await this.userService.updateUserStatus(userId, UserStatus.ONLINE);
    socket.join(`user:${userId}`);

    this.setupChatHandlers(socket);
    this.setupTypingHandlers(socket);

    socket.on("disconnect", () => this.handleDisconnect(socket));
  }

  private setupChatHandlers(socket: Socket): void {
    socket.on("message:send", async (data) => {
      try {
        const result = await this.messageService.createMessage(
          socket.data.userId,
          data
        );
        if (result.success) {
          socket.emit("message:sent", {
            messageId: result.data.id,
            status: "sent",
          });

          io.to(`user:${data.receiverId}`).emit("message:new", result.data);
        } else {
          socket.emit("message:error", {
            error: result.error,
          });
        }
      } catch (error) {
        this.logger.error("Message handling error", error);
        socket.emit("message:error", {
          error: "Failed to send message",
        });
      }
    });

    // socket.on("message:status", async (data) => {
    //   try {
    //     await this.messageService.updateMessgeStatus(
    //       data.messageId,
    //       data.status
    //     );

    //     io.to(`user:${data.senderId}`).emit("message:status_update", {
    //       messageId: data.messageId,
    //       status: data.status,
    //     });
    //   } catch (error) {
    //     this.logger.error("Status update error:", error);
    //   }
    // });
  }

  private setupTypingHandlers(socket: Socket): void {
    socket.on("typing:start", async (data) => {
      io.to(`user:${data.receiverId}`).emit("typing:update", {
        userId: socket.data.userId,
        isTyping: true,
      });
    });

    socket.on("typing:stop", async (data) => {
      io.to(`user:${data.receiverId}`).emit("typing:update", {
        userId: socket.data.userId,
        isTyping: false,
      });
    });
  }

  private async handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;

    try {
      const connection = await this.getActiveConnections(userId);
      if (connection === 0) {
        await this.userService.updateUserStatus(userId, UserStatus.OFFLINE);
      }

      io.emit("user:status", {
        userId,
        status: "offline",
      });

      this.logger.info(`User ${userId} disconnected`);
    } catch (error) {
      this.logger.error(`Disconnect error for user ${userId}:`, error);
    }
  }

  private async getActiveConnections(userId: string): Promise<number> {
    const socket = await io.in(`user:${userId}`).fetchSockets();
    return socket.length;
  }

  public async sendToUser(
    userId: string,
    event: string,
    data: any
  ): Promise<void> {
    io.to(`user:${userId}`).emit(event, data);
  }

  public async broadcastMessage(event: string, data: any): Promise<void> {
    io.emit(event, data);
  }
}

const socketService = SocketService.getInstance();
