import { useEffect, useRef, useState } from "react";
import { ArrowDownIcon, Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { getMessages } from "@/hooks/useMessage";
import { useChatStore } from "@/store/useChatStore";
import useAuthStore from "@/store/useAuthStore";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { TypingIndicator } from "../shared/TypingIndicator";
import { useMessage } from "@/hooks/useMessage";
import { useMessageStore } from "@/store/useMessageStore";
import { useUploadThing } from "@/utils/uploathings";

export default function MessageList() {
  const { user, accessToken } = useAuthStore();
  const { activeChatId } = useChatStore();

  const [isNearBottom, setIsNearBottom] = useState(true);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!activeChatId) return null;

  const { markAsRead } = useMessage(activeChatId);
  const { isTyping } = useTypingIndicator(activeChatId);
  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  const { isLoading, error } = getMessages(activeChatId);
  const { messages } = useMessageStore();

  // const unReadMessages = messages.filter(
  //   (message: any) =>
  //     message.status !== "read" &&
  //     message.senderId._id !== user?._id &&
  //     !message._id.startsWith("temp-")
  // );
  // const messageIds = unReadMessages.map((message) => message._id);
  // useEffect(() => {
  //   if (messageIds.length > 0) {
  //     markAsRead(messageIds);
  //   }
  // }, [messages]);

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, scrollTop, clientHeight } =
          scrollContainerRef.current;
        const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsNearBottom(nearBottom);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-20"
      >
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm p-4 text-center">
              {error.message || "something went wrong."}
            </div>
          ) : (
            messages[activeChatId]?.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={
                  (message.senderId?._id || message.senderId) === user?._id
                }
              />
            ))
          )}
        </div>
        <div ref={messageEndRef} />
      </div>

      {isTyping && (
        <div className="sticky bottom-14 ml-4  backdrop-blur-sm">
          <TypingIndicator />
        </div>
      )}

      {!isNearBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-4 right-4 p-2 bg-primary rounded-full border shadow-lg hover:bg-muted transition-colors duration-200"
        >
          <ArrowDownIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
