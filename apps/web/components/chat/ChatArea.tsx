import { useChatStore } from "@/store/useChatStore";
import { useChatSocket } from "@/hooks/useChatSocket";
import MessageList from "../message/MessageList";
import ChatHeader from "./ChatHeader";
import MessageInput from "../message/MessageInput";
import { EmptyState } from "./EmptyChat";

export const ChatArea = () => {
  const { activeChatId } = useChatStore();
  useChatSocket(activeChatId || "");

  return (
    <div className="flex flex-col h-full">
      {activeChatId ? (
        <>
          <div className="flex-shrink-0">
            <ChatHeader />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <MessageList />
            </div>
          </div>
          <div className="flex-shrink-0 pb-4">
            <MessageInput />
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};
