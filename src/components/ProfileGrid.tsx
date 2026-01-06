import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "./ProfileCard";
import { Loader2, Crown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  user_id: string;
  display_name: string;
  age: number;
  city?: string | null;
  photos: string[];
  online_status?: boolean;
  is_prime?: boolean;
  nowpick_active_until?: string | null;
  short_description?: string | null;
  intention_tags?: string[] | null;
  last_active?: string;
  latitude?: number | null;
  longitude?: number | null;
  private_photos?: string[] | null;
  allow_highlight?: boolean | null;
  invisible_mode?: boolean | null;
  hide_activity_status?: boolean | null;
}

interface ProfileGridProps {
  profiles: Profile[];
  currentUserId?: string;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  userLocation?: { lat: number; lng: number } | null;
  isPrime?: boolean;
  isLimitReached?: boolean;
}

interface ModerationData {
  blockedIds: Set<string>;
  reportCounts: Map<string, number>;
  blockCounts: Map<string, number>;
}

// Check if profile qualifies for highlighting (Boost/NowPick/Prime + online)
const isHighlightCandidate = (profile: Profile): { eligible: boolean; type: 'active' | 'featured' } => {
  // Respect user's preference - if they disabled highlighting, skip them
  if (profile.allow_highlight === false) {
    return { eligible: false, type: 'active' };
  }

  const now = new Date();
  const isNowPick = profile.nowpick_active_until && new Date(profile.nowpick_active_until) > now;
  const isPrime = profile.is_prime;
  const isOnline = profile.online_status;

  // NowPick or Prime users get "Destacado"
  if (isNowPick || isPrime) {
    return { eligible: true, type: 'featured' };
  }

  // Online users with good engagement get "Activo ahora"
  if (isOnline) {
    const hasPhotos = profile.photos && profile.photos.length >= 2;
    const hasDescription = !!profile.short_description;
    if (hasPhotos && hasDescription) {
      return { eligible: true, type: 'active' };
    }
  }

  return { eligible: false, type: 'active' };
};

const ProfileGrid = ({ profiles, currentUserId, loadingMore, hasMore, onLoadMore, userLocation, isPrime, isLimitReached }: ProfileGridProps) => {
  const navigate = useNavigate();
  const [moderationData, setModerationData] = useState<ModerationData>({
    blockedIds: new Set(),
    reportCounts: new Map(),
    blockCounts: new Map(),
  });
  const loaderRef = useRef<HTMLDivElement>(null);

  const handleProfileClick = (profile: Profile) => {
    navigate(`/profile/${profile.user_id}`);
  };

  // Fetch moderation data for all profiles in one batch
  useEffect(() => {
    if (!currentUserId || profiles.length === 0) return;

    const fetchModerationData = async () => {
      const profileIds = profiles.map(p => p.user_id);

      // Fetch blocks involving current user
      const { data: blocks } = await supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`) as { data: { blocker_id: string; blocked_id: string }[] | null };

      const blockedIds = new Set<string>();
      blocks?.forEach(block => {
        if (block.blocker_id === currentUserId) blockedIds.add(block.blocked_id);
        if (block.blocked_id === currentUserId) blockedIds.add(block.blocker_id);
      });

      // Fetch report counts for all profiles
      const { data: reports } = await supabase
        .from("reports")
        .select("reported_id")
        .in("reported_id", profileIds) as { data: { reported_id: string }[] | null };

      const reportCounts = new Map<string, number>();
      reports?.forEach(report => {
        const count = reportCounts.get(report.reported_id) || 0;
        reportCounts.set(report.reported_id, count + 1);
      });

      // Fetch block counts for all profiles (how many times they've been blocked)
      const { data: allBlocks } = await supabase
        .from("blocks")
        .select("blocked_id")
        .in("blocked_id", profileIds) as { data: { blocked_id: string }[] | null };

      const blockCounts = new Map<string, number>();
      allBlocks?.forEach(block => {
        const count = blockCounts.get(block.blocked_id) || 0;
        blockCounts.set(block.blocked_id, count + 1);
      });

      setModerationData({ blockedIds, reportCounts, blockCounts });
    };

    fetchModerationData();
  }, [currentUserId, profiles]);

  // Calculate quality score for a profile (local calculation)
  // Calculate quality score for a profile (local calculation)
  const calculateLocalScore = useCallback((profile: Profile): number => {
    let score = 100;

    const reportCount = moderationData.reportCounts.get(profile.user_id) || 0;
    const blockCount = moderationData.blockCounts.get(profile.user_id) || 0;

    score -= reportCount * 10;
    score -= blockCount * 5;

    // Bonus for profile completeness
    if (profile.photos && profile.photos.length > 0) score += 10;
    if (profile.short_description) score += 5;
    if (profile.intention_tags && profile.intention_tags.length > 0) score += 5;

    return Math.max(0, Math.min(100, score));
  }, [moderationData]);



  // Filter and sort profiles with moderation
  const moderatedProfiles = useMemo(() => {
    return profiles
      // Filter out blocked users and shadowbanned (score < 40)
      .filter(profile => {
        if (moderationData.blockedIds.has(profile.user_id)) return false;
        const score = calculateLocalScore(profile);
        if (score < 40) return false; // Shadowban threshold
        return true;
      })
      // Sort: NowPick first, then by quality score, then online, then by last_active
      .sort((a, b) => {
        const aIsNowPick = a.nowpick_active_until && new Date(a.nowpick_active_until) > new Date();
        const bIsNowPick = b.nowpick_active_until && new Date(b.nowpick_active_until) > new Date();

        if (aIsNowPick && !bIsNowPick) return -1;
        if (!aIsNowPick && bIsNowPick) return 1;

        // Then by quality score
        const aScore = calculateLocalScore(a);
        const bScore = calculateLocalScore(b);
        if (aScore !== bScore) return bScore - aScore;

        // Then by online status
        if (a.online_status && !b.online_status) return -1;
        if (!a.online_status && b.online_status) return 1;

        return 0;
      });
  }, [profiles, moderationData, calculateLocalScore]);

  // Determine which profiles to highlight (max 2 per screen)
  const highlightedProfileIds = useMemo(() => {
    const highlighted = new Map<string, 'active' | 'featured'>();
    let count = 0;
    const MAX_HIGHLIGHTS = 2;

    for (const profile of moderatedProfiles) {
      if (count >= MAX_HIGHLIGHTS) break;

      const { eligible, type } = isHighlightCandidate(profile);
      if (eligible) {
        highlighted.set(profile.user_id, type);
        count++;
      }
    }

    return highlighted;
  }, [moderatedProfiles]);

  // Handle For You variant content specifically
  if (isPrime && isLimitReached) {
    // Logic for upsell handled below
  }

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore]);

  if (moderatedProfiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">No hay perfiles disponibles</p>
        <p className="text-sm text-muted-foreground mt-1">Vuelve más tarde</p>
      </div>
    );
  }

  return (
    <>
      {/* Responsive grid: 2 cols on mobile, 3-4 cols on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {moderatedProfiles.map((profile, index) => {
          const highlightType = highlightedProfileIds.get(profile.user_id);
          const isHighlighted = !!highlightType;

          // Logic for displaying For You style (if requested by parent or specific logic)
          // For now, standard grid doesn't force "For You" variant unless specified.

          return (
            <div
              key={profile.user_id}
              className="stagger-item"
              style={{ animationDelay: `${Math.min(index * 0.03, 0.4)}s` }}
            >
              <ProfileCard
                profile={profile}
                onClick={() => handleProfileClick(profile)}
                compact
                userLocation={userLocation}
                isHighlighted={isHighlighted}
                highlightType={highlightType}
                viewerIsPrime={isPrime}
                hideDistance={true} // Always hide distance on grid per new requirements
              />
            </div>
          );
        })}
        {/* Prime Upsell Card - shown when FREE user hits limit */}
        {!isPrime && isLimitReached && (
          <div className="stagger-item" style={{ animationDelay: "0.5s" }}>
            <div
              onClick={() => navigate("/prime")}
              className="relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer group bg-gradient-to-br from-prime/20 via-prime/10 to-background border border-prime/30 hover:border-prime/50 transition-all flex flex-col items-center justify-center p-3 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-prime/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Eye className="h-6 w-6 text-prime" />
              </div>
              <p className="text-sm font-medium text-foreground leading-tight mb-1">
                Este perfil está más cerca de lo que crees.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Desbloquéalo con Prime.
              </p>
              <Button
                size="sm"
                className="bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground text-xs shadow-md shadow-prime/20"
              >
                <Crown className="h-3 w-3 mr-1" />
                Ver más
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Infinite scroll loader */}
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-6">
          {loadingMore && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </>
  );
};

export default ProfileGrid;
