import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCityActivity, ActivityLevel } from "./useCityActivity";

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
}

interface VisibilityFactors {
  // Base factors
  profileCompleteness: number; // 0-100
  activityScore: number; // Based on recent activity
  qualityScore: number; // Based on moderation data
  
  // Conditional boosts (not artificial advantages)
  isNowPickActive: boolean;
  isPrime: boolean;
  isOnline: boolean;
  
  // City context
  cityActivityLevel: ActivityLevel;
}

interface VisibilityResult {
  score: number;
  tier: "hidden" | "low" | "normal" | "boosted" | "featured";
  reason: string;
}

// Visibility score thresholds
const VISIBILITY_THRESHOLDS = {
  hidden: 0,
  low: 30,
  normal: 50,
  boosted: 75,
  featured: 90,
};

export function useGrowthVisibility(userCity: string | null | undefined) {
  const { activityData, config, getVisibilityBoost } = useCityActivity(userCity);

  // Calculate profile completeness (encourages quality profiles)
  const calculateProfileCompleteness = useCallback((profile: Profile): number => {
    let score = 0;
    
    // Photos (most important for engagement)
    if (profile.photos && profile.photos.length > 0) {
      score += 30;
      if (profile.photos.length >= 3) score += 10;
    }
    
    // Bio/description
    if (profile.short_description && profile.short_description.length > 20) {
      score += 20;
    }
    
    // Intention tags (shows clear intent)
    if (profile.intention_tags && profile.intention_tags.length > 0) {
      score += 15;
    }
    
    // City (enables location-based features)
    if (profile.city) {
      score += 10;
    }
    
    // Location coordinates (enables proximity features)
    if (profile.latitude && profile.longitude) {
      score += 15;
    }
    
    return Math.min(100, score);
  }, []);

  // Calculate activity score (recent engagement)
  const calculateActivityScore = useCallback((profile: Profile): number => {
    if (!profile.last_active) return 0;
    
    const lastActive = new Date(profile.last_active);
    const now = new Date();
    const minutesAgo = (now.getTime() - lastActive.getTime()) / (1000 * 60);
    
    // Active now = high score, degrades over time
    if (minutesAgo < 5) return 100;
    if (minutesAgo < 15) return 85;
    if (minutesAgo < 30) return 70;
    if (minutesAgo < 60) return 50;
    if (minutesAgo < 120) return 30;
    if (minutesAgo < 360) return 15;
    
    return 5; // Dormant users
  }, []);

  // Calculate overall visibility score
  const calculateVisibility = useCallback((
    profile: Profile,
    qualityScore: number = 100 // From moderation system
  ): VisibilityResult => {
    const completeness = calculateProfileCompleteness(profile);
    const activity = calculateActivityScore(profile);
    const cityLevel = activityData?.activityLevel || "medium";
    
    // Base score from core factors
    let baseScore = (completeness * 0.3) + (activity * 0.3) + (qualityScore * 0.4);
    
    // Apply city-based visibility adjustment
    baseScore = getVisibilityBoost(baseScore);
    
    // NowPick boost (legitimate feature, not artificial)
    const isNowPickActive = profile.nowpick_active_until && 
      new Date(profile.nowpick_active_until) > new Date();
    if (isNowPickActive) {
      baseScore = Math.min(100, baseScore + 25);
    }
    
    // Online boost (real-time availability)
    if (profile.online_status) {
      baseScore = Math.min(100, baseScore + 10);
    }
    
    // Prime acceleration (better positioning, not artificial visibility)
    // Prime users don't get hidden - they're always at least "normal"
    if (profile.is_prime && baseScore < VISIBILITY_THRESHOLDS.normal) {
      baseScore = VISIBILITY_THRESHOLDS.normal;
    }
    
    // Determine tier
    let tier: VisibilityResult["tier"] = "normal";
    let reason = "Visibilidad estándar";
    
    if (baseScore < VISIBILITY_THRESHOLDS.low) {
      tier = "hidden";
      reason = "Completa tu perfil para ser visible";
    } else if (baseScore < VISIBILITY_THRESHOLDS.normal) {
      tier = "low";
      reason = "Mejora tu perfil para destacar";
    } else if (baseScore >= VISIBILITY_THRESHOLDS.featured) {
      tier = "featured";
      reason = isNowPickActive ? "NowPick activo" : "Perfil destacado";
    } else if (baseScore >= VISIBILITY_THRESHOLDS.boosted) {
      tier = "boosted";
      reason = "Alta actividad reciente";
    }
    
    return {
      score: Math.round(baseScore),
      tier,
      reason,
    };
  }, [activityData, calculateProfileCompleteness, calculateActivityScore, getVisibilityBoost]);

  // Sort profiles by visibility for grid display
  const sortByVisibility = useCallback((
    profiles: Profile[],
    qualityScores: Map<string, number> = new Map()
  ): Profile[] => {
    return [...profiles].sort((a, b) => {
      const visA = calculateVisibility(a, qualityScores.get(a.user_id) || 100);
      const visB = calculateVisibility(b, qualityScores.get(b.user_id) || 100);
      
      // Featured profiles always first
      if (visA.tier === "featured" && visB.tier !== "featured") return -1;
      if (visB.tier === "featured" && visA.tier !== "featured") return 1;
      
      // Then by score
      return visB.score - visA.score;
    });
  }, [calculateVisibility]);

  // Filter out hidden profiles
  const filterByVisibility = useCallback((
    profiles: Profile[],
    qualityScores: Map<string, number> = new Map()
  ): Profile[] => {
    return profiles.filter(profile => {
      const vis = calculateVisibility(profile, qualityScores.get(profile.user_id) || 100);
      return vis.tier !== "hidden";
    });
  }, [calculateVisibility]);

  // Calculate match expiration based on city activity and Prime status
  const getMatchExpirationTime = useCallback((isPrimeA: boolean, isPrimeB: boolean): Date | null => {
    // If either user is Prime, no expiration
    if (isPrimeA || isPrimeB) return null;
    
    const expirationMinutes = config?.matchExpirationMinutes || 30;
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + expirationMinutes);
    
    return expirationTime;
  }, [config]);

  return {
    calculateVisibility,
    sortByVisibility,
    filterByVisibility,
    getMatchExpirationTime,
    calculateProfileCompleteness,
    calculateActivityScore,
    activityLevel: activityData?.activityLevel || "medium",
  };
}
