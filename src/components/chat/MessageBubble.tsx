import { useState, forwardRef } from "react";
import { format } from "date-fns";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Pencil, Trash2, Reply, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Message } from "@/hooks/useMessages";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply: (message: Message) => void;
  onScrollToMessage: (id: string) => void;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ message, isOwn, onEdit, onDelete, onReply, onScrollToMessage }, ref) => {
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content || "");

    const handleSaveEdit = () => {
      if (editContent.trim()) {
        onEdit(message.id, editContent.trim());
        setEditing(false);
      }
    };

    return (
      <div ref={ref} className={`group flex ${isOwn ? "justify-end" : "justify-start"} mb-3 px-4 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
        <div className={`max-w-[75%] md:max-w-[60%]`}>
          {/* Reply preview */}
          {message.replied_message && (
            <button
              onClick={() => message.reply_to && onScrollToMessage(message.reply_to)}
              className={`mb-1 block w-full rounded-t-lg border-l-2 border-primary bg-muted/50 p-2 text-left text-xs ${isOwn ? "text-right" : ""}`}
            >
              <span className="font-semibold text-primary">{message.replied_message.profiles?.username || "User"}</span>
              <p className="truncate text-muted-foreground">{message.replied_message.content || "📷 Image"}</p>
            </button>
          )}

          <div className={`rounded-2xl px-4 py-2.5 ${isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card text-card-foreground rounded-bl-md border border-border"}`}>
            {/* Sender name */}
            {!isOwn && (
              <p className="mb-1 text-xs font-semibold text-primary">
                {message.profiles?.username || "User"}
              </p>
            )}

            {/* Image */}
            {message.image_url && (
              <img
                src={message.image_url}
                alt="Shared image"
                className="mb-2 max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.image_url!, "_blank")}
              />
            )}

            {/* Content */}
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="h-8 text-sm bg-background text-foreground"
                  maxLength={2000}
                  autoFocus
                />
                <button onClick={handleSaveEdit} className="hover:opacity-80"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditing(false)} className="hover:opacity-80"><X className="h-4 w-4" /></button>
              </div>
            ) : message.content ? (
              <MarkdownRenderer content={message.content} className="text-sm leading-relaxed" />
            ) : null}

            {/* Footer */}
            <div className={`mt-1 flex items-center gap-1.5 text-[10px] opacity-70 ${isOwn ? "justify-end" : ""}`}>
              {message.is_edited && <span>(edited)</span>}
              <span>{format(new Date(message.created_at), "HH:mm")}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={`mt-0.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? "justify-end" : "justify-start"}`}>
            <button onClick={() => onReply(message)} className="rounded-full p-1.5 hover:bg-muted" title="Reply">
              <Reply className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {isOwn && (
              <>
                <button onClick={() => { setEditContent(message.content || ""); setEditing(true); }} className="rounded-full p-1.5 hover:bg-muted" title="Edit">
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => onDelete(message.id)} className="rounded-full p-1.5 hover:bg-destructive/10" title="Delete">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";
