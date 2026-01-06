import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  user_id: string;
  display_name: string;
  age: number;
  city: string | null;
  photos: string[];
  online_status: boolean | null;
  is_prime: boolean | null;
  nowpick_active_until: string | null;
  short_description: string | null;
  intention_tags: string[] | null;
  last_active: string | null;
  latitude: number | null;
  longitude: number | null;
  private_photos: string[] | null;
  allow_highlight: boolean | null;
  invisible_mode: boolean | null;
  visible_gender: string | null;
  hide_activity_status: boolean | null;
}

const PAGE_SIZE = 24;

export const useInfiniteProfiles = (userId: string | undefined, searchPreference?: string | null) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const currentRequestId = useRef(0);
  const processedIds = useRef(new Set<string>());

  // State to store last known location
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  // Get location on mount to decide strategy
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Loc not available for query:", err)
      );
    }
  }, []);

  const fetchProfiles = useCallback(async (reset = false) => {
    if (!userId) return;

    const requestId = ++currentRequestId.current;

    if (reset) {
      offsetRef.current = 0;
      setHasMore(true);
      // Don't clear profiles immediately to avoid flash, but we reset tracking
      processedIds.current.clear();
    }

    try {
      let data: Profile[] = [];
      let error = null;

      // Strategy: RPC if location known, else standard query
      if (userLoc) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_nearby_profiles', {
          lat: userLoc.lat,
          long: userLoc.lng,
          limit_count: PAGE_SIZE,
          offset_count: offsetRef.current,
          filter_gender: searchPreference === "both" ? undefined : (searchPreference || undefined),
          ignore_user_id: userId
        } as any);

        if (rpcData) {
          // RPC returns loose object, cast to Profile (dist_km is extra but fine)
          data = rpcData.map((p: any) => ({ ...p, online_status: p.online_status || false })) as unknown as Profile[];
        }
        error = rpcError;

      } else {
        // Fallback: Standard query (random/recency based)
        let query = supabase
          .from("profiles")
          .select("user_id, display_name, age, city, photos, online_status, is_prime, nowpick_active_until, short_description, intention_tags, last_active, latitude, longitude, private_photos, allow_highlight, invisible_mode, visible_gender, hide_activity_status")
          .neq("user_id", userId)
          .eq("onboarding_completed", true)
          .or("invisible_mode.is.null,invisible_mode.eq.false");

        if (searchPreference === "men") {
          query = query.eq("visible_gender", "man");
        } else if (searchPreference === "women") {
          query = query.eq("visible_gender", "woman");
        }

        const { data: stdData, error: stdError } = await query
          .order("is_prime", { ascending: false, nullsFirst: false })
          .order("last_active", { ascending: false })
          // Add deterministic sort key to prevent shifting rows
          .order("user_id", { ascending: true })
          .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);

        data = stdData || [];
        error = stdError;
      }

      if (error) throw error;

      // Check if this is the latest request
      if (requestId !== currentRequestId.current) return;

      if (reset) {
        // For reset, we replace everything
        const uniqueData: Profile[] = [];
        data.forEach(p => {
          if (!processedIds.current.has(p.user_id)) {
            processedIds.current.add(p.user_id);
            uniqueData.push(p);
          }
        });
        setProfiles(uniqueData);
      } else {
        setProfiles(prev => {
          // Filter out duplicates from incoming batch against ALREADY rendered IDs
          // We double check against 'prev' just in case ref was out of sync (rare)
          const newUnique = data.filter(p => {
            if (processedIds.current.has(p.user_id)) return false;
            // Also check current state as fallback
            if (prev.some(existing => existing.user_id === p.user_id)) return false;

            processedIds.current.add(p.user_id);
            return true;
          });
          return [...prev, ...newUnique];
        });
      }

      setHasMore(data.length === PAGE_SIZE);
      offsetRef.current += data.length;
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      if (requestId === currentRequestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [userId, searchPreference, userLoc]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchProfiles(false);
  }, [loadingMore, hasMore, fetchProfiles]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchProfiles(true);
  }, [fetchProfiles]);

  useEffect(() => {
    if (userId) {
      fetchProfiles(true);
    }
  }, [userId, searchPreference, userLoc, fetchProfiles]); // Re-fetch when location is found

  return { profiles, loading, loadingMore, hasMore, loadMore, refresh };
};
