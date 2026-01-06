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

  const fetchProfiles = useCallback(async (reset = false) => {
    if (!userId) return;
    
    if (reset) {
      offsetRef.current = 0;
      setHasMore(true);
    }

    try {
      let query = supabase
        .from("profiles")
        .select("user_id, display_name, age, city, photos, online_status, is_prime, nowpick_active_until, short_description, intention_tags, last_active, latitude, longitude, private_photos, allow_highlight, invisible_mode, visible_gender, hide_activity_status")
        .neq("user_id", userId)
        .or("invisible_mode.is.null,invisible_mode.eq.false");

      // Apply search preference filter
      if (searchPreference === "men") {
        query = query.eq("visible_gender", "man");
      } else if (searchPreference === "women") {
        query = query.eq("visible_gender", "woman");
      }
      // "both" = no filter, show all

      const { data, error } = await query
        .order("is_prime", { ascending: false, nullsFirst: false })
        .order("last_active", { ascending: false })
        .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);

      if (error) throw error;

      const newProfiles = data || [];
      
      if (reset) {
        setProfiles(newProfiles);
      } else {
        setProfiles(prev => [...prev, ...newProfiles]);
      }

      setHasMore(newProfiles.length === PAGE_SIZE);
      offsetRef.current += newProfiles.length;
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, searchPreference]);

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
  }, [userId, searchPreference, fetchProfiles]);

  return { profiles, loading, loadingMore, hasMore, loadMore, refresh };
};
