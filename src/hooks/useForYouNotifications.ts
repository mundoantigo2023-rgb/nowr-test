import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserNotifications } from "./useBrowserNotifications";
import { useAnalytics } from "./useAnalytics";

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const STORAGE_KEY = "nowr_foryou_last_check";

interface FeaturedProfile {
  user_id: string;
  display_name: string;
  nowpick_active_until: string | null;
  online_status: boolean | null;
  last_active: string | null;
}

export const useForYouNotifications = (userId: string | undefined) => {
  const { permission, requestPermission, sendNotification } = useBrowserNotifications();
  const { track } = useAnalytics();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownProfilesRef = useRef<Set<string>>(new Set());

  const checkForNewProfiles = useCallback(async () => {
    if (!userId) return;

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

    // Fetch recently boosted or highly active profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, nowpick_active_until, online_status, last_active")
      .neq("user_id", userId)
      .or("invisible_mode.is.null,invisible_mode.eq.false")
      .gte("last_active", fifteenMinutesAgo)
      .order("last_active", { ascending: false })
      .limit(20);

    if (error || !profiles) return;

    // Filter for featured profiles (boosted or very active)
    const featured = profiles.filter((p: FeaturedProfile) => {
      const isBoosted = p.nowpick_active_until && new Date(p.nowpick_active_until) > now;
      const isActiveNow = p.online_status && p.last_active &&
        new Date(p.last_active) > new Date(now.getTime() - 5 * 60 * 1000);
      return isBoosted || isActiveNow;
    });

    if (featured.length === 0) return;

    // Check for new profiles we haven't seen
    const currentIds = new Set(featured.map((p: FeaturedProfile) => p.user_id));
    const newProfiles = featured.filter(
      (p: FeaturedProfile) => !lastKnownProfilesRef.current.has(p.user_id)
    );

    // Update known profiles
    lastKnownProfilesRef.current = currentIds;

    // Only notify if we have new featured profiles and this isn't the first check
    const lastCheck = localStorage.getItem(STORAGE_KEY);
    if (newProfiles.length > 0 && lastCheck) {
      const boostedCount = newProfiles.filter(
        (p: FeaturedProfile) => p.nowpick_active_until && new Date(p.nowpick_active_until) > now
      ).length;

      let title = "";
      let body = "";

      if (boostedCount > 0) {
        title = boostedCount === 1 
          ? "Nuevo perfil destacado" 
          : `${boostedCount} nuevos perfiles destacados`;
        body = boostedCount === 1
          ? `${newProfiles[0].display_name} está destacado ahora`
          : "Perfiles con alta intención te esperan";
      } else {
        title = newProfiles.length === 1
          ? "Alguien activo ahora"
          : `${newProfiles.length} perfiles activos`;
        body = "Nuevos perfiles en Para ti";
      }

      const notification = sendNotification(title, {
        body,
        tag: "foryou-new-profiles",
      });

      if (notification) {
        track("notification_sent", {
          screen: "for_you",
          profileCount: newProfiles.length,
          boostedCount,
        });

        notification.onclick = () => {
          window.focus();
          window.location.href = "/for-you";
          notification.close();
        };
      }
    }

    localStorage.setItem(STORAGE_KEY, now.toISOString());
  }, [userId, sendNotification, track]);

  // Request permission on mount
  useEffect(() => {
    if (userId && permission === "default") {
      // Delay permission request to not be intrusive
      const timeout = setTimeout(() => {
        requestPermission();
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [userId, permission, requestPermission]);

  // Start monitoring
  useEffect(() => {
    if (!userId) return;

    // Initial check
    checkForNewProfiles();

    // Set up interval
    intervalRef.current = setInterval(checkForNewProfiles, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, checkForNewProfiles]);

  return {
    permission,
    requestPermission,
  };
};
