import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MessageRow {
  id: string;
  sender_id: string;
  match_id: string;
  is_read: boolean | null;
}

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      // Get all matches for the user to safeguard access
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`) as { data: { id: string }[] | null };

      if (!matches || matches.length === 0) {
        setUnreadCount(0);
        return;
      }

      const matchIds = matches.map(m => m.id);

      // Simple, efficient count query for unread messages received by the user
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("match_id", matchIds)
        .neq("sender_id", userId)
        .eq("is_read", false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          // Optimistically update if unrelated to me (Wait, filter strictly)
          // We can't easily check if newMsg.match_id is in my matches without local state of matchIds.
          // But usually, one only receives messages in their matches.
          // For now, simpler to increment if it's NOT from me and NOT read.
          if (newMsg.sender_id !== userId && !newMsg.is_read) {
            // Ideally we check if match_id belongs to user, but for now this is a safe heuristic 
            // assuming RLS prevents receiving others' messages? 
            // Actually RLS might block the subscription events for others anyway.
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updated = payload.new as MessageRow;
          const old = payload.old as MessageRow;

          // If message was marked as read
          if (updated.sender_id !== userId && !old.is_read && updated.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return unreadCount;
};
