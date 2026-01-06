import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TypingState {
  [key: string]: boolean;
}

export const useTypingIndicator = (
  matchId: string | undefined,
  userId: string | null,
  isPrime: boolean
) => {
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to typing presence
  useEffect(() => {
    if (!matchId || !userId || !isPrime) return;

    const channel = supabase.channel(`typing-${matchId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ typing: boolean; userId: string }>();
        
        // Check if any other user is typing
        let isOtherTyping = false;
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (presence.userId !== userId && presence.typing) {
              isOtherTyping = true;
            }
          });
        });
        
        setOtherUserTyping(isOtherTyping);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ typing: false, userId });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [matchId, userId, isPrime]);

  // Broadcast typing state
  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!channelRef.current || !userId || !isPrime) return;

      await channelRef.current.track({ typing: isTyping, userId });

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-clear typing after 3 seconds of no activity
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(async () => {
          if (channelRef.current) {
            await channelRef.current.track({ typing: false, userId });
          }
        }, 3000);
      }
    },
    [userId, isPrime]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    otherUserTyping,
    setTyping,
  };
};
