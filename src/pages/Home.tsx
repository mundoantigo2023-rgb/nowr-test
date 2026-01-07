import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ProfileGrid from "@/components/ProfileGrid";
import ProfileCard from "@/components/ProfileCard";
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
  const { profiles, loading, loadingMore, hasMore, loadMore, refresh } = useInfiniteProfiles(user?.id, searchPreference, filters);
  const livePresenceCount = useLivePresence(user?.id);
  const { track, trackPageView } = useAnalytics();
  const { activityData, getCopy } = useCityActivity(userCity);
  const cityDynamicCopy = getCopy();

  // Use the presence tracker hook for activity management
  usePresenceTracker(user?.id);

  // Quick filter chips - active state only
  const [quickFilterState, setQuickFilterState] = useState({
    online: false,
    nearby: false,
    favorites: false,
  });

  // Derive the full chips array based on user's Prime status for "Prime" filter visibility if needed
  // Per requirements: Online, Cerca, Favoritos, Prime (only if Prime or conditionally)
  const quickFilters = useMemo(() => {
    const filters = [
      { id: "online", label: t("online"), active: quickFilterState.online },
      { id: "nearby", label: t("nearby"), active: quickFilterState.nearby },
    ];

    if (isPrime) {
      // Example: logic to add specific Prime filters if needed, currently kept simple
    }

    return filters;
  }, [t, quickFilterState, isPrime]);

  // Advanced filters
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 99],
    distance: 50,
    presence: "all",
    interests: [],
  });

  // ... (auth and session effects remain the same) ...
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
        track("session_started");
        trackPageView("discovery", { userId: session.user.id });

        (supabase.from("profiles") as any)
          .select("city, is_prime, search_preference")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              if (data.city) setUserCity(data.city);
              setIsPrime(data.is_prime || false);
              setSearchPreference(data.search_preference);
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setUserCity, setIsPrime, setSearchPreference, track, trackPageView]);

  // ... (location effect remains same) ...
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


  const toggleQuickFilter = (id: string) => {
    track("discovery_filter_applied", { filterType: id });
    setQuickFilterState((prev) => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const handleSearchPreferenceChange = async (pref: "men" | "women" | "both") => {
    if (!user) return;
    setSearchPreference(pref);
    track("search_preference_changed", { preference: pref });
    try {
      await (supabase.from("profiles") as any).update({ search_preference: pref }).eq("user_id", user.id);
    } catch (error) {
      console.error("Error saving search preference:", error);
    }
  };

  const handleLoadMore = () => {
    track("discovery_scrolled", { profileCount: profiles.length });
    loadMore();
  };

  // ... (keep calculateDistance helper) ...
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter profiles logic
  const { regularProfiles, forYouProfiles, isLimitReached } = useMemo(() => {
    let result = [...profiles];

    // 1. FILTERING
    // Quick Filters
    if (quickFilterState.online) {
      result = result.filter((p) => p.online_status);
    }
    // "Nearby" filter - strict distance logic (e.g. < 5km)
    if (quickFilterState.nearby && userLocation) {
      result = result.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const dist = calculateDistance(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
        return dist <= 5; // Hardcoded "Nearby" threshold
      });
    }

    // Advanced Filters
    result = result.filter((p) => p.age >= filters.ageRange[0] && p.age <= filters.ageRange[1]);

    // Distance (Slider)
    if (userLocation) {
      result = result.filter(p => {
        if (!p.latitude || !p.longitude) return true; // keep if no location (optional decision)
        const dist = calculateDistance(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
        return dist <= filters.distance;
      });
    }

    // Presence Time Filter
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

    // 2. SORTING
    // We rely on the server-side sorting (Prime -> Recent -> UserID) from useInfiniteProfiles
    // to ensure list stability and prevent "jumping" of cards.
    // Client-side sorting here caused instability when profiles updated.

    // 3. SEGMENTATION (For You vs Regular)
    // "Destacados" (formerly For You) = ONLY Prime users or Boosted profiles
    const forYouCandidates = result.filter(p => (p.nowpick_active_until && new Date(p.nowpick_active_until) > new Date()) || p.is_prime);

    // Sort "Destacados" by boost status/Prime to ensure quality
    forYouCandidates.sort((a, b) => {
      // Boosted first
      const aBoost = a.nowpick_active_until && new Date(a.nowpick_active_until) > new Date();
      const bBoost = b.nowpick_active_until && new Date(b.nowpick_active_until) > new Date();
      if (aBoost && !bBoost) return -1;
      if (!aBoost && bBoost) return 1;
      return 0;
    });

    const forYou = forYouCandidates.slice(0, 6); // Keep limited number

    // Remove "Destacados" items from Regular list to avoid duplication
    const forYouIds = new Set(forYou.map(p => p.user_id));
    let regular = result.filter(p => !forYouIds.has(p.user_id));

    // FREE tier limit
    let limitReached = false;
    if (!isPrime) {
      const densityLimits = { high: 80, medium: 70, low: 60 };
      const limit = densityLimits[activityData?.activityLevel || "medium"];
      if (regular.length > limit) {
        regular = regular.slice(0, limit);
        limitReached = true;
      }
    }

    return { regularProfiles: regular, forYouProfiles: forYou, isLimitReached: limitReached };
  }, [profiles, quickFilterState, filters, userLocation, isPrime, activityData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* 1. TOPBAR: Logo, Search, Filters */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <NowrBrandLogo size="sm" animated={true} />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={refresh}
              className="p-2 rounded-full hover:bg-secondary/50 transition-colors active:scale-95"
              aria-label="Refresh feed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>
            </button>

            {/* Search Icon (Placeholder) */}
            <button className="p-2 rounded-full hover:bg-secondary/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            </button>

            {/* Filter Drawer Trigger */}
            <FilterDrawer
              filters={filters}
              onFiltersChange={setFilters}
              isPrime={isPrime}
              // We pass null for handling change here if we want to remove the control, 
              // but for now keeping it as a "Temporary Override" or fully sync?
              // User said "configured in my profile". 
              // Let's keep it sync'd: passing the current pref and handler updates DB.
              searchPreference={searchPreference as "men" | "women" | "both" | null}
              onSearchPreferenceChange={handleSearchPreferenceChange}
            />
          </div>
        </div>

        {/* 2. FILTER PILLS ROW */}
        <div className="px-4 pb-3 pt-1">
          <FilterChips
            chips={quickFilters}
            onToggle={toggleQuickFilter}
          // Removed internal searchPreference handling here to keep row clean as requested
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-1.5 pb-4 overflow-y-auto">

        {forYouProfiles.length > 0 && (
          <div className="mb-6 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-3 px-2">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Destacados</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 shadow-sm">DESTACADOS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              {forYouProfiles.map((profile, i) => (
                <div key={profile.user_id} style={{ animationDelay: `${i * 0.1}s` }} className="animate-in fade-in zoom-in-95 duration-300">
                  <ProfileCard
                    profile={profile}
                    onClick={() => navigate(`/profile/${profile.user_id}`)}
                    compact={false}
                    userLocation={userLocation}
                    variant="forYou"
                    hideDistance={true}
                    viewerIsPrime={isPrime}
                    className="max-w-[320px] mx-auto md:max-w-none md:mx-0 w-full aspect-[4/5] md:aspect-video lg:aspect-[3/1]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Regular Grid */}
        <div className="mt-2">
          {regularProfiles.length > 0 && <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Explorar</h2>}
          <ProfileGrid
            profiles={regularProfiles}
            currentUserId={user?.id}
            loadingMore={loadingMore}
            hasMore={hasMore && !isLimitReached}
            onLoadMore={handleLoadMore}
            userLocation={userLocation}
            isPrime={isPrime}
            isLimitReached={isLimitReached}
          />
        </div>
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
