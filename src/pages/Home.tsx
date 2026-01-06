import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ProfileGrid from "@/components/ProfileGrid";
import BottomNav from "@/components/BottomNav";
import NowrBrandLogo from "@/components/NowrBrandLogo";
import FilterChips from "@/components/FilterChips";
import FilterDrawer from "@/components/FilterDrawer";
import RetentionBanner from "@/components/RetentionBanner";
import InstallBanner from "@/components/InstallBanner";
import { NowrLogoLoader } from "@/components/NowrLogo";
import { useInfiniteProfiles } from "@/hooks/useInfiniteProfiles";
import LivePresenceIndicator, { useLivePresence } from "@/components/LivePresenceIndicator";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCityActivity } from "@/hooks/useCityActivity";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePresenceTracker } from "@/hooks/usePresence";

interface FilterState {
  ageRange: [number, number];
  distance: number;
  presence: "all" | "now" | "today";
  interests: string[];
}

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPrime, setIsPrime] = useState(false);
  const [searchPreference, setSearchPreference] = useState<string | null>(null);
  const { profiles, loading, loadingMore, hasMore, loadMore, refresh } = useInfiniteProfiles(user?.id, searchPreference);
  const livePresenceCount = useLivePresence(user?.id);
  const { track, trackPageView } = useAnalytics();
  const { activityData, getCopy } = useCityActivity(userCity);
  const cityDynamicCopy = getCopy();

  // Use the presence tracker hook for activity management
  usePresenceTracker(user?.id);

  // Quick filter chips - active state only, labels derived from translations
  const [quickFilterState, setQuickFilterState] = useState({
    cerca: false,
    ahora: false,
    confoto: false,
  });

  // Derive the full chips array from state + current translations
  const quickFilters = useMemo(() => [
    { id: "cerca", label: t("nearby"), active: quickFilterState.cerca },
    { id: "ahora", label: t("now"), active: quickFilterState.ahora },
    { id: "confoto", label: t("withPhoto"), active: quickFilterState.confoto },
  ], [t, quickFilterState]);

  // Advanced filters
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 99],
    distance: 50,
    presence: "all",
    interests: [],
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/");
      } else {
        // Track session start and page view
        track("session_started");
        trackPageView("discovery", { userId: session.user.id });

        // Fetch user's city, prime status, and search preference
        supabase.from("profiles")
          .select("city, is_prime, search_preference")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.city) setUserCity(data.city);
            setIsPrime(data?.is_prime || false);

            // If no search_preference, redirect to onboarding
            if (!data?.search_preference) {
              navigate("/onboarding");
              return;
            }
            setSearchPreference(data.search_preference);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  // Note: Online status is now managed by usePresenceTracker hook

  const toggleQuickFilter = (id: string) => {
    track("discovery_filter_applied", { filterType: id });
    setQuickFilterState((prev) => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  // Handle search preference change
  const handleSearchPreferenceChange = async (pref: "men" | "women" | "both") => {
    if (!user) return;

    setSearchPreference(pref);
    track("search_preference_changed", { preference: pref });

    // Save to database
    try {
      await supabase
        .from("profiles")
        .update({ search_preference: pref })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error saving search preference:", error);
    }
  };

  // Track scroll depth for analytics
  const handleLoadMore = () => {
    track("discovery_scrolled", { profileCount: profiles.length });
    loadMore();
  };

  // Calculate distance helper
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter profiles based on quick filters and advanced filters
  const { filteredProfiles, isLimitReached } = useMemo(() => {
    let result = [...profiles];

    // Apply quick filters
    const nearbyActive = quickFilters.find((f) => f.id === "cerca")?.active;
    const nowActive = quickFilters.find((f) => f.id === "ahora")?.active;
    const withPhotoActive = quickFilters.find((f) => f.id === "confoto")?.active;

    if (nowActive) {
      result = result.filter((p) => p.online_status);
    }

    if (withPhotoActive) {
      result = result.filter((p) => p.photos && p.photos.length > 0);
    }

    // Apply advanced filters
    result = result.filter(
      (p) => p.age >= filters.ageRange[0] && p.age <= filters.ageRange[1]
    );

    if (filters.presence === "now") {
      result = result.filter((p) => p.online_status);
    } else if (filters.presence === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter((p) => {
        if (!p.last_active) return false;
        return new Date(p.last_active) >= today;
      });
    }

    // Filter by interests (matches profile intention_tags)
    if (filters.interests.length > 0) {
      result = result.filter((p) => {
        if (!p.intention_tags || p.intention_tags.length === 0) return false;
        return filters.interests.some((interest) => p.intention_tags?.includes(interest));
      });
    }

    // If "Cerca" filter is active and user has location, filter by distance and sort
    if (nearbyActive && userLocation) {
      result = result
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          ...p,
          _distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            p.latitude!,
            p.longitude!
          ),
        }))
        .filter((p) => p._distance <= filters.distance) // Filter by max distance
        .sort((a, b) => a._distance - b._distance); // Sort by distance
    }

    // FREE tier limit: cap profiles based on city density
    // High density: 80, Medium: 70, Low: 60
    let limitReached = false;
    if (!isPrime) {
      const densityLimits = {
        high: 80,
        medium: 70,
        low: 60,
      };
      const limit = densityLimits[activityData?.activityLevel || "medium"];
      if (result.length > limit) {
        result = result.slice(0, limit);
        limitReached = true;
      }
    }

    return { filteredProfiles: result, isLimitReached: limitReached };
  }, [profiles, quickFilters, filters, userLocation, isPrime, activityData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <NowrBrandLogo size="sm" animated={true} />
          <FilterDrawer
            filters={filters}
            onFiltersChange={setFilters}
            isPrime={isPrime}
            searchPreference={searchPreference as "men" | "women" | "both" | null}
            onSearchPreferenceChange={handleSearchPreferenceChange}
          />
        </div>

        {/* Quick filter chips */}
        <div className="px-4 pb-2">
          <FilterChips
            chips={quickFilters}
            onToggle={toggleQuickFilter}
            searchPreference={searchPreference as "men" | "women" | "both" | null}
            onSearchPreferenceChange={handleSearchPreferenceChange}
          />
        </div>
      </header>

      {/* Live presence indicator - single unified display */}
      <div className="px-4 py-2 flex items-center justify-between">
        <LivePresenceIndicator
          count={livePresenceCount}
          label={cityDynamicCopy.presenceLabel}
          activityLevel={activityData?.activityLevel}
        />
        {activityData && activityData.activityLevel === "low" && (
          <p className="text-[10px] text-primary/70 max-w-[140px] text-right">
            {t("visibilityMatters")}
          </p>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 px-1.5 pb-4 overflow-y-auto">
        <ProfileGrid
          profiles={filteredProfiles}
          currentUserId={user?.id}
          loadingMore={loadingMore}
          hasMore={hasMore && !isLimitReached}
          onLoadMore={handleLoadMore}
          userLocation={userLocation}
          isPrime={isPrime}
          isLimitReached={isLimitReached}
        />
      </main>

      {/* Retention Notifications */}
      <RetentionBanner userId={user?.id || null} />

      {/* Install App Banner */}
      <InstallBanner />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Home;
