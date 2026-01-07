import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PresenceStatus =
  | "online" // 0-2 min
  | "recent" // 3-30 min
  | "hours"  // 31 min - 24h
  | "yesterday" // 24-48h
  | "days"; // +48h

export interface PresenceInfo {
  status: PresenceStatus;
  minutesAgo: number;
}

// Translated labels by language and status
export const presenceLabels: Record<string, Record<PresenceStatus, { exact: (min: number) => string; generic: string }>> = {
  es: {
    online: { exact: () => "Conectado ahora", generic: "Conectado ahora" },
    recent: { exact: (min) => `Hace ${min} min`, generic: "Hace unos minutos" },
    hours: { exact: (min) => `Hace ${Math.floor(min / 60)}h`, generic: "Hoy" },
    yesterday: { exact: () => "Visto ayer", generic: "Ayer" },
    days: { exact: () => "Visto hace días", generic: "Hace días" },
  },
  en: {
    online: { exact: () => "Online now", generic: "Online now" },
    recent: { exact: (min) => `${min} min ago`, generic: "A few minutes ago" },
    hours: { exact: (min) => `${Math.floor(min / 60)}h ago`, generic: "Today" },
    yesterday: { exact: () => "Seen yesterday", generic: "Yesterday" },
    days: { exact: () => "Seen days ago", generic: "Days ago" },
  },
  pt: {
    online: { exact: () => "Online agora", generic: "Online agora" },
    recent: { exact: (min) => `Há ${min} min`, generic: "Há alguns minutos" },
    hours: { exact: (min) => `Há ${Math.floor(min / 60)}h`, generic: "Hoje" },
    yesterday: { exact: () => "Visto ontem", generic: "Ontem" },
    days: { exact: () => "Visto há dias", generic: "Há dias" },
  },
  fr: {
    online: { exact: () => "En ligne", generic: "En ligne" },
    recent: { exact: (min) => `Il y a ${min} min`, generic: "Il y a quelques minutes" },
    hours: { exact: (min) => `Il y a ${Math.floor(min / 60)}h`, generic: "Aujourd'hui" },
    yesterday: { exact: () => "Vu hier", generic: "Hier" },
    days: { exact: () => "Vu il y a quelques jours", generic: "Il y a quelques jours" },
  },
};

// Calculate presence info from last_active timestamp
export function getPresenceInfo(
  lastActive: string | null,
  isOnline: boolean | null,
  hideActivityStatus: boolean = false
): PresenceInfo | null {
  // If user hides activity status, return null
  if (hideActivityStatus) {
    return null;
  }

  // If currently online (within last 2 minutes activity)
  if (isOnline) {
    return {
      status: "online",
      minutesAgo: 0,
    };
  }

  if (!lastActive) {
    return null;
  }

  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffMs = now.getTime() - lastActiveDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  // 0-2 min → "Conectado ahora"
  if (diffMinutes <= 2) {
    return {
      status: "online",
      minutesAgo: diffMinutes,
    };
  }

  // 3-30 min → "Activo hace X min"
  if (diffMinutes <= 30) {
    return {
      status: "recent",
      minutesAgo: diffMinutes,
    };
  }

  // 31 min – 24h → "Activo hace X h"
  if (diffHours < 24) {
    return {
      status: "hours",
      minutesAgo: diffMinutes,
    };
  }

  // 24–48h → "Visto ayer"
  if (diffHours < 48) {
    return {
      status: "yesterday",
      minutesAgo: diffMinutes,
    };
  }

  // +48h → "Visto hace días"
  return {
    status: "days",
    minutesAgo: diffMinutes,
  };
}

// Get label for a presence status
export function getPresenceLabel(
  presence: PresenceInfo,
  isPrime: boolean,
  language: string = "es"
): string {
  const lang = presenceLabels[language] || presenceLabels.es;
  const statusLabels = lang[presence.status];

  return isPrime ? statusLabels.exact(presence.minutesAgo) : statusLabels.generic;
}

// Hook to manage user's own presence (activity tracking)
export function usePresenceTracker(userId: string | undefined) {
  const lastUpdateRef = useRef<number>(0);
  const isActiveRef = useRef(true);
  const UPDATE_INTERVAL = 60000; // 1 minute
  const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  const lastActivityRef = useRef<number>(Date.now());

  const updateActivity = useCallback(async (forceOnline = true) => {
    if (!userId) return;

    const now = Date.now();
    // Throttle updates to prevent too many DB calls
    if (now - lastUpdateRef.current < 30000) return; // Min 30s between updates

    lastUpdateRef.current = now;
    lastActivityRef.current = now;

    try {
      await (supabase
        .from("profiles") as any)
        .update({
          online_status: forceOnline,
          last_active: new Date().toISOString()
        })
        .eq("user_id", userId);
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  }, [userId]);

  const setOffline = useCallback(async () => {
    if (!userId) return;

    try {
      await (supabase
        .from("profiles") as any)
        .update({ online_status: false })
        .eq("user_id", userId);
    } catch (error) {
      console.error("Error setting offline:", error);
    }
  }, [userId]);

  // Use sendBeacon for reliable offline notification when page closes
  const setOfflineBeacon = useCallback(() => {
    if (!userId) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const url = `${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`;
    const data = JSON.stringify({ online_status: false });

    // sendBeacon is more reliable than fetch for page unload
    const blob = new Blob([data], { type: "application/json" });

    // Try sendBeacon first (most reliable for page close)
    if (navigator.sendBeacon) {
      // Create a form data approach for better compatibility
      const headers = {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      };

      // Use fetch with keepalive as primary method (better header support)
      fetch(url, {
        method: "PATCH",
        headers,
        body: data,
        keepalive: true // Crucial: allows request to outlive page
      }).catch(() => {
        // Silently fail - page is closing anyway
      });
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Initial presence update
    updateActivity(true);

    // Set up activity listeners
    const handleActivity = () => {
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        updateActivity(true);
      } else {
        lastActivityRef.current = Date.now();
      }
    };

    // Track user interactions
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for inactivity periodically
    const inactivityCheck = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > INACTIVITY_THRESHOLD) {
        if (isActiveRef.current) {
          isActiveRef.current = false;
          setOffline(); // Set offline when inactive
        }
      }
    }, 30000);

    // Periodic presence update while active
    const presenceInterval = setInterval(() => {
      if (isActiveRef.current) {
        updateActivity(true);
      }
    }, UPDATE_INTERVAL);

    // Handle visibility change (tab hidden/visible)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
        // Set offline after a short delay when tab is hidden
        setTimeout(() => {
          if (document.hidden) {
            setOffline();
          }
        }, 10000); // 10 seconds delay
      } else {
        isActiveRef.current = true;
        updateActivity(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Handle page unload - use beacon for reliability
    const handleUnload = () => {
      setOfflineBeacon();
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload); // Better for mobile

    // Cleanup on unmount
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(inactivityCheck);
      clearInterval(presenceInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      setOffline(); // Set offline when component unmounts
    };
  }, [userId, updateActivity, setOffline, setOfflineBeacon]);

  return { updateActivity, setOffline };
}
