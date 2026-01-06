import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileVisitor {
  id: string;
  viewer_id: string;
  viewed_at: string;
  viewer_profile?: {
    display_name: string;
    photos: string[] | null;
    online_status: boolean | null;
    is_prime: boolean | null;
  };
}

export const useProfileVisitors = (userId: string | undefined, isPrime: boolean) => {
  const [visitors, setVisitors] = useState<ProfileVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch visitors
  useEffect(() => {
    if (!userId || !isPrime) {
      setVisitors([]);
      setLoading(false);
      return;
    }

    const fetchVisitors = async () => {
      setLoading(true);
      
      // Get recent visitors (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("profile_views")
        .select("id, viewer_id, viewed_at")
        .eq("viewed_id", userId)
        .gte("viewed_at", thirtyDaysAgo.toISOString())
        .order("viewed_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching visitors:", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setVisitors([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for visitors
      const viewerIds = data.map(v => v.viewer_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, photos, online_status, is_prime")
        .in("user_id", viewerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const visitorsWithProfiles: ProfileVisitor[] = data.map(v => ({
        ...v,
        viewer_profile: profileMap.get(v.viewer_id) ? {
          display_name: profileMap.get(v.viewer_id)!.display_name,
          photos: profileMap.get(v.viewer_id)!.photos,
          online_status: profileMap.get(v.viewer_id)!.online_status,
          is_prime: profileMap.get(v.viewer_id)!.is_prime,
        } : undefined,
      }));

      setVisitors(visitorsWithProfiles);
      
      // Count visitors from last 24 hours as "new"
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const newVisitors = visitorsWithProfiles.filter(
        v => new Date(v.viewed_at) > oneDayAgo
      ).length;
      setUnreadCount(newVisitors);
      
      setLoading(false);
    };

    fetchVisitors();

    // Subscribe to new views in realtime
    const channel = supabase
      .channel("profile-views-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profile_views",
          filter: `viewed_id=eq.${userId}`,
        },
        async (payload) => {
          const newView = payload.new as { id: string; viewer_id: string; viewed_at: string };
          
          // Fetch the viewer's profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, display_name, photos, online_status, is_prime")
            .eq("user_id", newView.viewer_id)
            .single();

          const visitorWithProfile: ProfileVisitor = {
            ...newView,
            viewer_profile: profile ? {
              display_name: profile.display_name,
              photos: profile.photos,
              online_status: profile.online_status,
              is_prime: profile.is_prime,
            } : undefined,
          };

          setVisitors(prev => {
            // Remove existing entry from same viewer if exists
            const filtered = prev.filter(v => v.viewer_id !== newView.viewer_id);
            return [visitorWithProfile, ...filtered];
          });
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isPrime]);

  // Record a profile view (skips if viewer is in invisible mode)
  const recordView = async (viewedUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.id === viewedUserId) return;

    // Check if current user is in invisible mode
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("invisible_mode, is_prime")
      .eq("user_id", session.user.id)
      .single();

    // Don't record view if viewer is Prime and in invisible mode
    if (viewerProfile?.is_prime && viewerProfile?.invisible_mode) {
      return;
    }

    // Upsert to update timestamp if already viewed
    await supabase
      .from("profile_views")
      .upsert(
        {
          viewer_id: session.user.id,
          viewed_id: viewedUserId,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "viewer_id,viewed_id" }
      );
  };

  return {
    visitors,
    loading,
    unreadCount,
    recordView,
  };
};
