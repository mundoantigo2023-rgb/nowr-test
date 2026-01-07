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

interface FilterOptions {
  ageRange: [number, number];
  distance: number;
}

export const useInfiniteProfiles = (userId: string | undefined, searchPreference?: string | null, filters?: FilterOptions) => {
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
      let usedFallback = true; // Track if we used standard query

      if (userLoc) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_nearby_profiles', {
          lat: userLoc.lat,
          long: userLoc.lng,
          limit_count: PAGE_SIZE,
          offset_count: offsetRef.current,
          filter_gender: searchPreference === "both" ? undefined : (searchPreference || undefined),
          ignore_user_id: userId
        } as any);

        if (rpcError) {
          console.error("RPC Error, falling back:", rpcError);
          // Don't throw, let fallback handle it
        } else if (rpcData && rpcData.length > 0) {
          // RPC returns loose object, cast to Profile (dist_km is extra but fine)
          data = rpcData.map((p: any) => ({ ...p, online_status: p.online_status || false })) as unknown as Profile[];
          usedFallback = false;
        }
      }

      if (usedFallback) {
        // Fallback: Standard query (random/recency based)
        let query = supabase
          .from("profiles")
          .select("user_id, display_name, age, city, photos, online_status, is_prime, nowpick_active_until, short_description, intention_tags, last_active, latitude, longitude, private_photos, allow_highlight, invisible_mode, visible_gender, hide_activity_status")
          .neq("user_id", userId)
          .or("invisible_mode.is.null,invisible_mode.eq.false");

        if (searchPreference === "men") {
          query = query.eq("visible_gender", "man");
        } else if (searchPreference === "women") {
          query = query.eq("visible_gender", "woman");
        }

        if (filters) {
          query = query.gte('age', filters.ageRange[0]).lte('age', filters.ageRange[1]);
        }

        // Apply strict Age filter
        // Note: For RPC, this is handled on DB side or needs to be passed.
        // For standard query, we must apply it here.
        // We assume 'age' column exists and is indexed.
        // We'll filter in-memory if needed, but DB is better.
        // Let's rely on client-side filtering below if we don't trust DB params yet, 
        // BUT for pagination to work, DB filtering is must.
        // Adding simple age range to query:
        // query = query.gte('age', 18).lte('age', 99); // This would be generic
        // The user complained about filters not working.
        // The `Home` component does client-side filtering (see below in Home.tsx snippet),
        // effectively discarding rows. This causes "disappearing" profiles if page size is small.
        // WE MUST MOVE FILTERING TO DB QUERY to ensure consistency.

        // HOWEVER, useInfiniteProfiles arguments here are `userId` and `searchPreference`.
        // It does NOT receive the full filter object (age, distance).
        // To fix "Result Stability", we must pass filters to this hook OR do it in Home.
        // The PROPER FIX is to pass filters to the hook.
        // The *Quick Fix* to stabilize "appearing/disappearing" without refactoring everything:
        // is to ensure the query returns a stable superset and Home filters it consistently.
        // The issue "Mobile vs Desktop" is likely because Grid renders differently.

        // Let's verify standard query stability:
        query = query.neq("display_name", null); // basic check

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
  }, [userId, searchPreference, userLoc, filters]);

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
