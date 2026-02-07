import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTypingIndicator(userId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("typing-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "typing_indicators" }, async () => {
        const { data } = await supabase
          .from("typing_indicators")
          .select("user_id, is_typing, updated_at")
          .eq("is_typing", true)
          .neq("user_id", userId);

        if (data) {
          const now = Date.now();
          const activeTypers: string[] = [];
          for (const t of data) {
            if (now - new Date(t.updated_at).getTime() < 5000) {
              const { data: profile } = await supabase.from("profiles").select("username").eq("id", t.user_id).single();
              if (profile) activeTypers.push(profile.username);
            }
          }
          setTypingUsers(activeTypers);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!userId) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    await supabase.from("typing_indicators").upsert({
      user_id: userId,
      is_typing: isTyping,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (isTyping) {
      timeoutRef.current = setTimeout(async () => {
        await supabase.from("typing_indicators").upsert({
          user_id: userId,
          is_typing: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }, 3000);
    }
  }, [userId]);

  return { typingUsers, setTyping };
}
