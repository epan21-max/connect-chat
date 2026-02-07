import { useRef, useEffect, useCallback, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMessages, Message } from "@/hooks/useMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

export default function Chat() {
  const { user, loading } = useAuth();
  const { messages, loading: messagesLoading, sendMessage, editMessage, deleteMessage } = useMessages();
  const { typingUsers, setTyping } = useTypingIndicator(user?.id);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback((content: string, replyTo?: string, imageUrl?: string) => {
    if (!user) return;
    sendMessage(content, user.id, replyTo, imageUrl);
    setTyping(false);
  }, [user, sendMessage, setTyping]);

  const handleTyping = useCallback(() => {
    setTyping(true);
  }, [setTyping]);

  const scrollToMessage = useCallback((id: string) => {
    const el = messageRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary/50");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary/50"), 1500);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto py-4">
        {messagesLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Be the first to say hello! 👋</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              ref={(el) => { if (el) messageRefs.current.set(msg.id, el); }}
              message={msg}
              isOwn={msg.user_id === user.id}
              onEdit={editMessage}
              onDelete={deleteMessage}
              onReply={setReplyingTo}
              onScrollToMessage={scrollToMessage}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <TypingIndicator typingUsers={typingUsers} />
      <ChatInput
        onSend={handleSend}
        onTyping={handleTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        userId={user.id}
      />
    </div>
  );
}
