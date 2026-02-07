import { useState, useRef, useCallback } from "react";
import { Send, Smile, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import type { Message } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (content: string, replyTo?: string, imageUrl?: string) => void;
  onTyping: () => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  userId: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function ChatInput({ onSend, onTyping, replyingTo, onCancelReply, userId }: ChatInputProps) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;

    let imageUrl: string | undefined;
    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chat-images").upload(path, imageFile);
      if (error) {
        toast.error("Failed to upload image");
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
      setUploading(false);
    }

    onSend(trimmed, replyingTo?.id, imageUrl);
    setText("");
    setImageFile(null);
    setImagePreview(null);
    onCancelReply();
    textareaRef.current?.focus();
  }, [text, imageFile, onSend, replyingTo, onCancelReply, userId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setText((prev) => prev + emoji.native);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border bg-card p-3">
      {/* Reply preview */}
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm">
          <div className="flex-1 truncate">
            <span className="font-semibold text-primary">{replyingTo.profiles?.username}</span>
            <span className="ml-2 text-muted-foreground">{replyingTo.content || "📷 Image"}</span>
          </div>
          <button onClick={onCancelReply}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover" />
          <button
            onClick={() => { setImageFile(null); setImagePreview(null); }}
            className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5"
          >
            <X className="h-3 w-3 text-destructive-foreground" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none" side="top" align="start">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" previewPosition="none" skinTonePosition="none" />
          </PopoverContent>
        </Popover>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          style={{ maxHeight: "120px", overflow: "auto" }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 120) + "px";
          }}
        />

        <Button
          onClick={handleSend}
          size="icon"
          disabled={(!text.trim() && !imageFile) || uploading}
          className="shrink-0 rounded-full"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
