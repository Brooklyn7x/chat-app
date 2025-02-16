import { useEffect, useRef, useState } from "react";
import { ArrowDownIcon, Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { useMessages } from "@/hooks/useMessages";
import { useChatStore } from "@/store/useChatStore";
import useAuthStore from "@/store/useAuthStore";

interface MessageListProps {}

export default function MessageList({}: MessageListProps) {
  const { user } = useAuthStore();
  const { activeChatId } = useChatStore();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const { messages, isLoading, error } = useMessages(activeChatId || "");
  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

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
    <div ref={scrollContainerRef} className="flex-1 p-4 overflow-y-scroll">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm p-4 text-center">{error}</div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.senderId === user?._id}
            />
          ))
        )}
      </div>
      {!isNearBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-4 right-4 p-2 bg-black rounded-full border bg-primary"
        >
          <ArrowDownIcon className="h-6 w-6" />
        </button>
      )}
      <div ref={messageEndRef} />
    </div>
  );
}
