import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MessageRow {
  id: string;
  sender_id: string;
  match_id: string;
  read: boolean | null;
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
      // Get all matches for the user
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`);

      if (!matches || matches.length === 0) {
        setUnreadCount(0);
        return;
      }

      const matchIds = matches.map(m => m.id);

      // Get all messages in user's matches
      const { data: messages } = await supabase
        .from("messages")
        .select("id, sender_id, match_id");
      
      if (messages) {
        // Filter: only messages in user's matches, not sent by user, and unread
        // Since 'read' column is new, we'll fetch it separately with raw query approach
        const relevantMessages = messages.filter(
          msg => matchIds.includes(msg.match_id) && msg.sender_id !== userId
        );
        
        // For now, count all messages from others as unread (we'll refine when type updates)
        // We need to check the read status via a separate approach
        let unreadTotal = 0;
        for (const msg of relevantMessages) {
          const { data } = await supabase
            .from("messages")
            .select("id")
            .eq("id", msg.id)
            .eq("read", false)
            .maybeSingle();
          if (data) unreadTotal++;
        }
        setUnreadCount(unreadTotal);
      } else {
        setUnreadCount(0);
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
          if (newMsg.sender_id !== userId && !newMsg.read) {
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
          if (updated.sender_id !== userId && !old.read && updated.read) {
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
