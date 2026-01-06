import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActivityLevel = "low" | "medium" | "high";

interface CityActivityData {
  city: string;
  activityLevel: ActivityLevel;
  activeUsers: number;
  lastUpdated: Date;
}

interface CityConfig {
  // Match expiration times based on activity
  matchExpirationMinutes: number;
  // Visibility boost multiplier for active cities
  visibilityMultiplier: number;
  // NowPick duration boost
  nowpickDurationMinutes: number;
  // Dynamic copy
  copy: {
    presenceLabel: string;
    urgencyMessage: string;
    emptyStateMessage: string;
    primeUpsell: string;
  };
}

// Activity thresholds
const LOW_ACTIVITY_THRESHOLD = 5;
const HIGH_ACTIVITY_THRESHOLD = 25;

// Configuration by activity level - designed to increase engagement
const CITY_CONFIGS: Record<ActivityLevel, Omit<CityConfig, "copy">> = {
  low: {
    matchExpirationMinutes: 60, // Longer expiration in low-activity cities
    visibilityMultiplier: 1.5, // Boost visibility to compensate
    nowpickDurationMinutes: 20, // Longer NowPick to maximize exposure
  },
  medium: {
    matchExpirationMinutes: 30, // Standard expiration
    visibilityMultiplier: 1.0, // Normal visibility
    nowpickDurationMinutes: 15, // Standard NowPick
  },
  high: {
    matchExpirationMinutes: 20, // Shorter expiration creates urgency
    visibilityMultiplier: 0.8, // Slightly reduce to manage competition
    nowpickDurationMinutes: 10, // Faster NowPick rotation
  },
};

// Dynamic copy by activity level - adult, discreet tone
const CITY_COPY: Record<ActivityLevel, CityConfig["copy"]> = {
  low: {
    presenceLabel: "Usuarios activos",
    urgencyMessage: "Pocos usuarios cerca. Tu visibilidad importa más.",
    emptyStateMessage: "La actividad en tu zona es baja. Amplía tu radio de búsqueda.",
    primeUpsell: "Con Prime, destaca cuando más importa.",
  },
  medium: {
    presenceLabel: "Usuarios cerca ahora",
    urgencyMessage: "Hay movimiento en tu zona.",
    emptyStateMessage: "Sigue explorando. Hay personas cerca.",
    primeUpsell: "Prime te da prioridad en el momento justo.",
  },
  high: {
    presenceLabel: "Alta actividad ahora",
    urgencyMessage: "Muchos usuarios activos. Las conexiones son rápidas.",
    emptyStateMessage: "Alta demanda. Sé directo con tu intención.",
    primeUpsell: "En momentos de alta actividad, Prime marca la diferencia.",
  },
};

export function useCityActivity(userCity: string | null | undefined) {
  const [activityData, setActivityData] = useState<CityActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch activity for current city
  const fetchCityActivity = useCallback(async () => {
    if (!userCity) {
      setLoading(false);
      return;
    }

    try {
      // Count active users in the same city (active in last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("city", userCity)
        .gte("last_active", fifteenMinutesAgo)
        .or("invisible_mode.is.null,invisible_mode.eq.false");

      if (error) throw error;

      const activeUsers = count || 0;
      let activityLevel: ActivityLevel = "medium";

      if (activeUsers < LOW_ACTIVITY_THRESHOLD) {
        activityLevel = "low";
      } else if (activeUsers >= HIGH_ACTIVITY_THRESHOLD) {
        activityLevel = "high";
      }

      setActivityData({
        city: userCity,
        activityLevel,
        activeUsers,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error("Error fetching city activity:", error);
      // Default to medium on error
      setActivityData({
        city: userCity,
        activityLevel: "medium",
        activeUsers: 0,
        lastUpdated: new Date(),
      });
    } finally {
      setLoading(false);
    }
  }, [userCity]);

  // Refresh activity periodically
  useEffect(() => {
    fetchCityActivity();

    // Refresh every 2 minutes
    const interval = setInterval(fetchCityActivity, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCityActivity]);

  // Get full config for current activity level
  const config = useMemo((): CityConfig | null => {
    if (!activityData) return null;

    const baseConfig = CITY_CONFIGS[activityData.activityLevel];
    const copy = CITY_COPY[activityData.activityLevel];

    return {
      ...baseConfig,
      copy,
    };
  }, [activityData]);

  // Calculate dynamic match expiration
  const getMatchExpiration = useCallback((isPrime: boolean): number => {
    if (isPrime) return Infinity; // Prime users have unlimited time

    if (!config) return 30; // Default 30 minutes
    return config.matchExpirationMinutes;
  }, [config]);

  // Get visibility priority based on city activity
  const getVisibilityBoost = useCallback((baseScore: number): number => {
    if (!config) return baseScore;
    return Math.round(baseScore * config.visibilityMultiplier);
  }, [config]);

  // Get NowPick duration for current city
  const getNowPickDuration = useCallback((): number => {
    if (!config) return 15; // Default 15 minutes
    return config.nowpickDurationMinutes;
  }, [config]);

  // Get dynamic copy for UI
  const getCopy = useCallback(() => {
    return config?.copy || CITY_COPY.medium;
  }, [config]);

  return {
    activityData,
    config,
    loading,
    refresh: fetchCityActivity,
    getMatchExpiration,
    getVisibilityBoost,
    getNowPickDuration,
    getCopy,
  };
}

// Export types for usage
export type { CityActivityData, CityConfig };
