import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Moderation score thresholds
const SCORE_PENALTY_REPORT = -10;
const SCORE_PENALTY_BLOCK = -5;
const SCORE_BONUS_QUALITY_MESSAGE = 2;
const SCORE_BONUS_MUTUAL_INTEREST = 5;
const SCORE_THRESHOLD_SHADOWBAN = -30;
const SCORE_THRESHOLD_LOW_VISIBILITY = -15;

interface ModerationResult {
  action: "none" | "low_visibility" | "shadowban";
  score: number;
}

export function useModeration() {
  // Calculate user's moderation score based on reports and blocks
  const calculateScore = useCallback(async (userId: string): Promise<number> => {
    let score = 100; // Start with perfect score

    // Count reports against this user
    const { count: reportCount } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("reported_user_id", userId);

    if (reportCount) {
      score += reportCount * SCORE_PENALTY_REPORT;
    }

    // Count blocks against this user
    const { count: blockCount } = await supabase
      .from("blocks")
      .select("*", { count: "exact", head: true })
      .eq("blocked_id", userId);

    if (blockCount) {
      score += blockCount * SCORE_PENALTY_BLOCK;
    }

    // Count mutual matches (quality indicator)
    const { count: matchCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (matchCount) {
      score += Math.min(matchCount * SCORE_BONUS_MUTUAL_INTEREST, 50);
    }

    // Bonus for profile completeness
    const { data: profile } = await supabase
      .from("profiles")
      .select("photos, short_description, intention_tags")
      .eq("user_id", userId)
      .single();

    if (profile) {
      if (profile.photos && profile.photos.length > 0) score += 10;
      if (profile.short_description) score += 5;
      if (profile.intention_tags && profile.intention_tags.length > 0) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }, []);

  // Get moderation action based on score
  const getModerationAction = useCallback(async (userId: string): Promise<ModerationResult> => {
    const score = await calculateScore(userId);

    if (score <= SCORE_THRESHOLD_SHADOWBAN) {
      return { action: "shadowban", score };
    }
    if (score <= SCORE_THRESHOLD_LOW_VISIBILITY) {
      return { action: "low_visibility", score };
    }
    return { action: "none", score };
  }, [calculateScore]);

  // Check if a user should be visible in discovery
  const shouldShowInDiscovery = useCallback(async (
    userId: string, 
    currentUserId: string
  ): Promise<boolean> => {
    // Check if blocked
    const { data: blocked } = await supabase
      .from("blocks")
      .select("id")
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${currentUserId})`)
      .limit(1)
      .maybeSingle();

    if (blocked) return false;

    // Check moderation status
    const result = await getModerationAction(userId);
    if (result.action === "shadowban") return false;

    return true;
  }, [getModerationAction]);

  // Get visibility priority for sorting (higher = shown first)
  const getVisibilityPriority = useCallback(async (userId: string): Promise<number> => {
    const score = await calculateScore(userId);
    
    // High quality users get priority
    if (score >= 80) return 100;
    if (score >= 60) return 80;
    if (score >= 40) return 60;
    if (score >= SCORE_THRESHOLD_LOW_VISIBILITY) return 40;
    
    // Low visibility users are pushed down
    return 20;
  }, [calculateScore]);

  // Report a user (silent action)
  const reportUser = useCallback(async (
    reporterId: string,
    reportedUserId: string,
    reason: string,
    details?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        details,
      });

      return !error;
    } catch {
      return false;
    }
  }, []);

  // Block a user
  const blockUser = useCallback(async (
    blockerId: string,
    blockedId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from("blocks").insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
      });

      return !error;
    } catch {
      return false;
    }
  }, []);

  return {
    calculateScore,
    getModerationAction,
    shouldShowInDiscovery,
    getVisibilityPriority,
    reportUser,
    blockUser,
  };
}
