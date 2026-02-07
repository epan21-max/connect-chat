import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Message = Tables<"messages"> & {
  profiles?: { username: string; avatar_url: string | null } | null;
  replied_message?: { content: string | null; profiles?: { username: string } | null } | null;
};

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const profilesCache = useRef<Map<string, { username: string; avatar_url: string | null }>>(new Map());

  const fetchProfile = useCallback(async (userId: string) => {
    if (profilesCache.current.has(userId)) return profilesCache.current.get(userId)!;
    const { data } = await supabase.from("profiles").select("username, avatar_url").eq("id", userId).single();
    if (data) profilesCache.current.set(userId, data);
    return data;
  }, []);

  const enrichMessage = useCallback(async (msg: Tables<"messages">): Promise<Message> => {
    const profile = await fetchProfile(msg.user_id);
    let replied_message: Message["replied_message"] = null;
    if (msg.reply_to) {
      const { data: reply } = await supabase.from("messages").select("content, user_id").eq("id", msg.reply_to).single();
      if (reply) {
        const replyProfile = await fetchProfile(reply.user_id);
        replied_message = { content: reply.content, profiles: replyProfile ? { username: replyProfile.username } : null };
      }
    }
    return { ...msg, profiles: profile, replied_message };
  }, [fetchProfile]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) {
        const enriched = await Promise.all(data.map(enrichMessage));
        setMessages(enriched);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const enriched = await enrichMessage(payload.new as Tables<"messages">);
        setMessages((prev) => [...prev, enriched]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, async (payload) => {
        const enriched = await enrichMessage(payload.new as Tables<"messages">);
        setMessages((prev) => prev.map((m) => (m.id === enriched.id ? enriched : m)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [enrichMessage]);

  const sendMessage = async (content: string, userId: string, replyTo?: string, imageUrl?: string) => {
    await supabase.from("messages").insert({
      content: content || null,
      user_id: userId,
      reply_to: replyTo || null,
      image_url: imageUrl || null,
    });
  };

  const editMessage = async (id: string, content: string) => {
    await supabase.from("messages").update({ content, is_edited: true }).eq("id", id);
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("messages").delete().eq("id", id);
  };

  return { messages, loading, sendMessage, editMessage, deleteMessage };
}
