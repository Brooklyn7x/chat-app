import { Message } from "@/types/message";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MessageStore {
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;

  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (
    chatId: string,
    tempId: string,
    updates: Partial<Message>
  ) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  updateMessageStatus: (messageId: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // deleteMessage: (messageId: string) => void;
  // updateMessageId: (tempId: string, messageId: string) => void;
  // updateMessageStatus: (
  //   messageId: string,
  //   status: "sent" | "delivered" | "read"
  // ) => void;
}

export const useMessageStore = create<MessageStore>()(
  persist(
    (set) => ({
      messages: {},
      isLoading: false,
      error: null,

      setMessages: (chatId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [chatId]: messages },
        })),

      addMessage: (message: Message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [message.conversationId || ""]: [
              ...(state.messages[message.conversationId || ""] || []),
              message,
            ],
          },
        })),

      updateMessage: (chatId, tempId, updates) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map((message) =>
              message._id === tempId ? { ...message, ...updates } : message
            ),
          },
        })),

      deleteMessage: (chatId, messageId) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId].filter(
              (message) => message.id !== messageId
            ),
          },
        }));
      },

      updateMessageStatus: (messageId, updates) =>
        set((state) => ({
          messages: {
            ...state.messages,
            ...Object.fromEntries(
              Object.entries(state.messages).map(([chatId, messages]) => [
                chatId,
                messages.map((message) =>
                  message._id === messageId
                    ? { ...message, ...updates }
                    : message
                ),
              ])
            ),
          },
        })),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // getMessages: (conversationId) => {
      //   return get()
      //     .messages.filter(
      //       (message) => message.conversationId === conversationId
      //     )
      //     .sort(
      //       (a, b) =>
      //         new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      //     );
      // },

      // addMessage: (message) => {
      //   set((state) => {
      //     const messageMap = new Map(
      //       state.messages.map((msg) => [msg._id, msg])
      //     );

      //     const formattedMessage = {
      //       _id: message._id,
      //       conversationId: message.conversationId,
      //       conversationType: message.conversationType,
      //       content: message.content,
      //       type: message.type || "text",
      //       status: message.status,
      //       senderId: message.senderId,
      //       receiverId: message.receiverId,
      //       timestamp: message.timestamp || new Date().toISOString(),
      //       sender: message.sender || {
      //         userId: message.senderId,
      //         timestamp: message.timestamp || new Date().toISOString(),
      //       },
      //     };

      //     messageMap.set(formattedMessage._id, formattedMessage);

      //     const sortedMessages = Array.from(messageMap.values()).sort(
      //       (a, b) =>
      //         new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      //     );

      //     return { messages: sortedMessages };
      //   });
      // },

      // updateMessageId(tempId, messageId) {
      //   set((state) => ({
      //     messages: state.messages.map((message) =>
      //       message._id === tempId ? { ...message, _id: messageId } : message
      //     ),
      //   }));
      // },

      // deleteMessage: (messageId) => {
      //   set((state) => ({
      //     messages: state.messages.filter(
      //       (message) => message._id !== messageId
      //     ),
      //   }));
      // },

      // updateMessageStatus: (
      //   messageId,
      //   status: "sent" | "delivered" | "read"
      // ) => {
      //   set((state) => ({
      //     messages: state.messages.map((message) =>
      //       message._id === messageId ? { ...message, status } : message
      //     ),
      //   }));
      // },

      // markMessagesAsRead: (conversationId) => {
      //   set((state) => ({
      //     messages: state.messages.map((message) =>
      //       message.conversationId === conversationId
      //         ? { ...message, status: "read" }
      //         : message
      //     ),
      //   }));
      // },
    }),
    {
      name: "message-store",
    }
  )
);
