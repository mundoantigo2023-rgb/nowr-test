import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Crown, Zap, MapPin, RefreshCw, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NowrLogoLoader } from "@/components/NowrLogo";
import BottomNav from "@/components/BottomNav";
import ProfilePreviewSheet from "@/components/ProfilePreviewSheet";
import PresenceIndicator from "@/components/PresenceIndicator";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNowPickSound } from "@/hooks/useNowPickSound";
import { useToast } from "@/hooks/use-toast";
import { getPresenceInfo } from "@/hooks/usePresence";
import { useLanguage } from "@/contexts/LanguageContext";

interface CuratedProfile {
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
  hide_activity_status: boolean | null;
  // Computed
  isBoosted: boolean;
  isActiveNow: boolean;
  isActiveRecent: boolean;
  engagementScore: number;
  responseChance: "high" | "medium" | "low";
}

const MAX_PROFILES = 12;

// Psychological microcopy for CTAs (non-aggressive)
const getResponseCopy = (profile: CuratedProfile, language: string): string | null => {
  if (profile.isActiveNow) {
    const copies: Record<string, string[]> = {
      es: ["Alta probabilidad de respuesta", "Disponible ahora", "Buen momento"],
      en: ["High chance of reply", "Available now", "Good timing"],
      pt: ["Alta chance de resposta", "Disponível agora", "Bom momento"],
      fr: ["Forte chance de réponse", "Disponible maintenant", "Bon moment"],
    };
    const langCopies = copies[language] || copies.es;
    return langCopies[Math.floor(Math.random() * langCopies.length)];
  }
  if (profile.isActiveRecent) {
    const copies: Record<string, string[]> = {
      es: ["Activo recientemente", "Suele responder rápido"],
      en: ["Recently active", "Usually responds quickly"],
      pt: ["Ativo recentemente", "Costuma responder rápido"],
      fr: ["Récemment actif", "Répond généralement vite"],
    };
    const langCopies = copies[language] || copies.es;
    return langCopies[Math.floor(Math.random() * langCopies.length)];
  }
  return null;
};

const getCtaCopy = (profile: CuratedProfile, language: string): string => {
  if (profile.isActiveNow) {
    const copies: Record<string, string[]> = {
      es: ["Habla ahora", "Es buen momento", "Escríbele"],
      en: ["Talk now", "Good timing", "Message them"],
      pt: ["Fale agora", "Bom momento", "Mande mensagem"],
      fr: ["Parle maintenant", "Bon moment", "Envoie un message"],
    };
    const langCopies = copies[language] || copies.es;
    return langCopies[Math.floor(Math.random() * langCopies.length)];
  }
  return language === "es" ? "Ver perfil" :
    language === "pt" ? "Ver perfil" :
      language === "fr" ? "Voir profil" : "View profile";
};

const ForYou = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isPrime, setIsPrime] = useState(false);
  const [profiles, setProfiles] = useState<CuratedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<CuratedProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { track, trackPageView } = useAnalytics();
  const { playNowPickSound } = useNowPickSound();
  const hasBoostedProfilesRef = useRef(false);

  // Check for expired boosts and remove profiles that no longer qualify
  useEffect(() => {
    const checkExpiredBoosts = () => {
      const now = new Date();
      setProfiles(currentProfiles => {
        const expiredBoosted = currentProfiles.filter(profile =>
          profile.isBoosted &&
          profile.nowpick_active_until &&
          new Date(profile.nowpick_active_until) <= now
        );

        const updatedProfiles = currentProfiles.map(profile => {
          const stillBoosted = profile.nowpick_active_until &&
            new Date(profile.nowpick_active_until) > now;

          return {
            ...profile,
            isBoosted: !!stillBoosted,
            engagementScore: stillBoosted
              ? profile.engagementScore
              : profile.engagementScore - 50
          };
        });

        const filteredProfiles = updatedProfiles.filter(p => p.engagementScore >= 25);

        const removedCount = currentProfiles.length - filteredProfiles.length;
        if (removedCount > 0 && expiredBoosted.length > 0) {
          toast({
            title: "Boost expirado",
            description: removedCount === 1
              ? `${expiredBoosted[0]?.display_name} ya no está destacado`
              : `${removedCount} perfiles ya no están destacados`,
            duration: 4000,
          });
        }

        return filteredProfiles;
      });
    };

    const interval = setInterval(checkExpiredBoosts, 10000);
    return () => clearInterval(interval);
  }, [toast]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => { }
      );
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Enhanced ranking algorithm with presence-based weighting
  const fetchCuratedProfiles = async (userId: string, userIsPrime: boolean) => {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

    // Fetch profiles with active NowPick boost (priority)
    const { data: boostedProfiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, age, city, photos, online_status, is_prime, nowpick_active_until, short_description, intention_tags, last_active, latitude, longitude, hide_activity_status")
      .neq("user_id", userId)
      .or("invisible_mode.is.null,invisible_mode.eq.false")
      .gt("nowpick_active_until", now.toISOString())
      .limit(20);

    // Fetch active profiles (last 30 minutes for wider pool)
    const { data: activeProfiles, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, age, city, photos, online_status, is_prime, nowpick_active_until, short_description, intention_tags, last_active, latitude, longitude, hide_activity_status")
      .neq("user_id", userId)
      .or("invisible_mode.is.null,invisible_mode.eq.false")
      .gte("last_active", thirtyMinutesAgo)
      .order("last_active", { ascending: false })
      .limit(60);

    if (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }

    // Merge and deduplicate (boosted first)
    const allProfiles = [...(boostedProfiles || []), ...(activeProfiles || [])];
    const uniqueProfiles = allProfiles.filter((profile, index, self) =>
      index === self.findIndex(p => p.user_id === profile.user_id)
    );

    // Enrich with engagement data using weighted scoring
    const enrichedProfiles: CuratedProfile[] = await Promise.all(
      uniqueProfiles.map(async (profile) => {
        const isBoosted = profile.nowpick_active_until &&
          new Date(profile.nowpick_active_until) > now;

        // Check activity status using presence system
        const presence = getPresenceInfo(profile.last_active, profile.online_status, profile.hide_activity_status || false);
        const isActiveNow = presence?.status === "online";
        const isActiveRecent = presence?.status === "recent";

        // Fetch interaction data
        const { count: matchCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .or(`user_a.eq.${profile.user_id},user_b.eq.${profile.user_id}`);

        const { count: interestCount } = await supabase
          .from("interests")
          .select("*", { count: "exact", head: true })
          .eq("to_user_id", profile.user_id);

        // WEIGHTED SCORING SYSTEM
        let engagementScore = 0;

        // 1. Activity recency (maximum priority) - up to 40 points
        if (isActiveNow) {
          engagementScore += 40; // Highest weight for online now
        } else if (isActiveRecent) {
          engagementScore += 25; // Recent activity
        } else if (presence?.status === "hours") {
          engagementScore += 10; // Active today
        }

        // 2. Boost active - 35 points (high but not dominant)
        if (isBoosted) {
          // Boost + Active = TOP priority
          engagementScore += isActiveNow ? 45 : 35;
        }

        // 3. Interactions received - up to 20 points
        if (interestCount) {
          engagementScore += Math.min(interestCount * 2, 20);
        }

        // 4. Match history (engagement indicator) - up to 15 points
        if (matchCount && matchCount > 0) {
          engagementScore += Math.min(matchCount * 3, 15);
        }

        // 5. Prime status - 10 points (moderate, not dominant)
        if (profile.is_prime) {
          engagementScore += 10;
        }

        // 6. Profile completeness - up to 10 points
        if (profile.photos && profile.photos.length >= 3) engagementScore += 5;
        if (profile.short_description) engagementScore += 3;
        if (profile.intention_tags && profile.intention_tags.length > 0) engagementScore += 2;

        // Calculate response chance
        let responseChance: "high" | "medium" | "low" = "low";
        if (isActiveNow) responseChance = "high";
        else if (isActiveRecent) responseChance = "medium";

        return {
          ...profile,
          isBoosted: !!isBoosted,
          isActiveNow: !!isActiveNow,
          isActiveRecent: !!isActiveRecent,
          engagementScore,
          responseChance,
        };
      })
    );

    // Filter and sort by weighted engagement
    const curated = enrichedProfiles
      .filter(p => p.engagementScore >= 25) // Minimum threshold
      .sort((a, b) => {
        // Boosted + Active profiles first
        const aBoostActive = a.isBoosted && a.isActiveNow;
        const bBoostActive = b.isBoosted && b.isActiveNow;
        if (aBoostActive && !bBoostActive) return -1;
        if (!aBoostActive && bBoostActive) return 1;

        // Then boosted profiles
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;

        // Then by engagement score
        return b.engagementScore - a.engagementScore;
      })
      .slice(0, MAX_PROFILES);

    return curated;
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/");
        return;
      }
      setUser(session.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_prime")
        .eq("user_id", session.user.id)
        .single();

      const userIsPrime = profile?.is_prime || false;
      setIsPrime(userIsPrime);

      trackPageView("for_you", { userId: session.user.id, isPrime: userIsPrime });

      const curated = await fetchCuratedProfiles(session.user.id, userIsPrime);
      setProfiles(curated);

      const hasBoosted = curated.some(p => p.isBoosted);
      if (hasBoosted && !hasBoostedProfilesRef.current) {
        hasBoostedProfilesRef.current = true;
        setTimeout(() => playNowPickSound(), 300);
      }

      setLoading(false);
    };

    init();
  }, [navigate]);

  const handleRefresh = async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    track("discovery_refreshed", { screen: "for_you" });
    const curated = await fetchCuratedProfiles(user.id, isPrime);
    setProfiles(curated);

    const hasBoosted = curated.some(p => p.isBoosted);
    if (hasBoosted) {
      playNowPickSound();
    }

    setRefreshing(false);
  };

  const handleProfileClick = (profile: CuratedProfile) => {
    track("discovery_profile_clicked", {
      screen: "for_you",
      profileId: profile.user_id,
      isBoosted: profile.isBoosted,
      isActiveNow: profile.isActiveNow,
    });
    setSelectedProfile(profile);
    setSheetOpen(true);
  };

  const getDistanceText = (profile: CuratedProfile): string | null => {
    if (!userLocation || !profile.latitude || !profile.longitude) return null;
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      profile.latitude,
      profile.longitude
    );
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

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
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Para ti</h1>
            <p className="text-xs text-muted-foreground">
              {profiles.filter(p => p.isActiveNow).length > 0
                ? `${profiles.filter(p => p.isActiveNow).length} activos ahora`
                : "Perfiles con alta intención"
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </Button>
        </div>
      </header>

      {/* Prime upsell for free users */}
      {!isPrime && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-prime/10 to-primary/10 border border-prime/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-prime/20">
              <Crown className="w-5 h-5 text-prime animate-prime-shimmer" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Ve quién está activo</p>
              <p className="text-xs text-muted-foreground">Con Prime, ves tiempos exactos de actividad</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/prime")}
              className="bg-prime/20 text-prime hover:bg-prime/30 border border-prime/30"
            >
              Prime
            </Button>
          </div>
        </div>
      )}

      {/* Curated profiles grid */}
      <main className="flex-1 p-4">
        {profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Sin perfiles destacados ahora</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
              Los perfiles con alta intención aparecen aquí. Vuelve más tarde.
            </p>
            <Button onClick={() => navigate("/home")} variant="outline">
              Explorar todos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {profiles.map((profile, index) => (
              <div
                key={profile.user_id}
                onClick={() => handleProfileClick(profile)}
                className={cn(
                  "relative rounded-xl overflow-hidden cursor-pointer group",
                  "aspect-[4/5] bg-card border border-border/30",
                  profile.isBoosted
                    ? "nowpick-boosted-card nowpick-border-animated"
                    : "foryou-card-enter",
                  profile.isBoosted && profile.isActiveNow && "ring-2 ring-online/70",
                  profile.isBoosted && !profile.isActiveNow && "ring-2 ring-primary/50",
                  profile.isBoosted && "foryou-shine-effect"
                )}
                style={{
                  animationDelay: profile.isBoosted ? '0s' : `${index * 0.08}s`,
                  animationFillMode: 'forwards'
                }}
              >
                {/* Profile image with hover zoom */}
                <img
                  src={profile.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`}
                  alt={profile.display_name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-80" />

                {/* Boosted shimmer overlay */}
                {profile.isBoosted && (
                  <div className="absolute inset-0 z-[1] pointer-events-none">
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-t",
                      profile.isActiveNow
                        ? "from-online/30 via-online/10 to-transparent"
                        : "from-primary/40 via-primary/10 to-transparent"
                    )} />
                  </div>
                )}

                {/* Status badge */}
                <div
                  className="absolute top-3 left-3 z-10"
                  style={{
                    animation: `foryou-card-enter 0.4s ease-out forwards`,
                    animationDelay: `${index * 0.08 + 0.3}s`,
                    opacity: 0
                  }}
                >
                  {profile.isBoosted && profile.isActiveNow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-online/90 text-white text-[10px] font-semibold backdrop-blur-md shadow-lg shadow-online/30 nowpick-badge-animated">
                      <Zap className="w-3 h-3" />
                      Destacado ahora
                    </span>
                  ) : profile.isBoosted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold backdrop-blur-md shadow-lg shadow-primary/30 nowpick-badge-animated">
                      <Zap className="w-3 h-3 nowpick-zap-animated" />
                      Destacado
                    </span>
                  ) : profile.isActiveNow ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-online/90 text-white text-[10px] font-semibold backdrop-blur-md shadow-lg shadow-online/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Activo ahora
                    </span>
                  ) : profile.isActiveRecent ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/80 text-white text-[10px] font-medium backdrop-blur-md">
                      Activo recientemente
                    </span>
                  ) : null}
                </div>

                {/* Prime badge */}
                {profile.is_prime && (
                  <div
                    className="absolute top-3 right-3 z-10"
                    style={{
                      animation: `foryou-card-enter 0.4s ease-out forwards`,
                      animationDelay: `${index * 0.08 + 0.35}s`,
                      opacity: 0
                    }}
                  >
                    <div className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                      <Crown className="w-4 h-4 text-prime drop-shadow-lg animate-prime-shimmer" />
                    </div>
                  </div>
                )}

                {/* Profile info with presence */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-3 z-10"
                  style={{
                    animation: `foryou-card-enter 0.5s ease-out forwards`,
                    animationDelay: `${index * 0.08 + 0.2}s`,
                    opacity: 0
                  }}
                >
                  <div className="flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate text-base drop-shadow-lg">
                        {profile.display_name}, {profile.age}
                      </p>

                      {/* Presence indicator - Prime sees exact, Free sees generic */}
                      {!profile.hide_activity_status && (
                        <div className="mt-0.5">
                          <PresenceIndicator
                            lastActive={profile.last_active}
                            isOnline={profile.online_status}
                            isPrime={isPrime}
                            hideActivityStatus={profile.hide_activity_status || false}
                            variant="text"
                            size="sm"
                            className="text-white/80"
                          />
                        </div>
                      )}

                      {/* Distance */}
                      {getDistanceText(profile) && (
                        <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {getDistanceText(profile)}
                        </p>
                      )}
                    </div>

                    {/* Online indicator */}
                    {profile.online_status && (
                      <span className="w-3 h-3 rounded-full bg-online border-2 border-white shadow-lg flex-shrink-0 pulse-online" />
                    )}
                  </div>

                  {/* Psychological microcopy CTA */}
                  {(profile.isActiveNow || profile.isActiveRecent) && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] font-medium">
                        <MessageCircle className="w-2.5 h-2.5" />
                        {getResponseCopy(profile, language) || getCtaCopy(profile, language)}
                      </span>
                    </div>
                  )}

                  {/* Intention tags */}
                  {profile.intention_tags && profile.intention_tags.length > 0 && !profile.isActiveNow && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {profile.intention_tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Session limit notice */}
        {profiles.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {profiles.filter(p => p.isActiveNow).length > 0
              ? `${profiles.filter(p => p.isActiveNow).length} perfiles activos ahora • ${profiles.length} total`
              : `${profiles.length} perfiles seleccionados para ti`
            }
          </p>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Profile Preview Sheet */}
      <ProfilePreviewSheet
        profile={selectedProfile}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default ForYou;
