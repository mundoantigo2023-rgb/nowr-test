import { Crown, MapPin, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { INTEREST_OPTIONS } from "@/lib/profileOptions";
import PresenceIndicator from "@/components/PresenceIndicator";

interface ProfileCardProps {
  profile: {
    user_id: string;
    display_name: string;
    age: number;
    city?: string | null;
    photos: string[];
    online_status?: boolean | null;
    is_prime?: boolean | null;
    nowpick_active_until?: string | null;
    last_active?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    private_photos?: string[] | null;
    intention_tags?: string[] | null;
    invisible_mode?: boolean | null;
    hide_activity_status?: boolean | null;
  };
  onClick?: () => void;
  compact?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  isHighlighted?: boolean;
  highlightType?: 'active' | 'featured';
  viewerIsPrime?: boolean; // Whether the viewer is Prime (can see exact times)
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
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

// Format distance for display
const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Get distance color based on proximity
const getDistanceColor = (km: number): { bg: string; text: string; icon: string } => {
  if (km < 2) {
    // Close - Green
    return { bg: "bg-green-500/80", text: "text-white", icon: "text-white" };
  } else if (km <= 10) {
    // Medium - Yellow/Amber
    return { bg: "bg-amber-500/80", text: "text-white", icon: "text-white" };
  } else {
    // Far - Gray
    return { bg: "bg-black/50", text: "text-white/80", icon: "text-white/60" };
  }
};

const ProfileCard = ({ profile, onClick, compact = false, userLocation, isHighlighted = false, highlightType, viewerIsPrime = false }: ProfileCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Hide online status for users in invisible mode (Prime feature)
  const isInvisible = profile.is_prime && profile.invisible_mode;
  const isOnline = isInvisible ? false : profile.online_status;
  const isPrime = profile.is_prime;
  const isNowPick = profile.nowpick_active_until && new Date(profile.nowpick_active_until) > new Date();
  const mainPhoto = profile.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`;
  const hasPrivateAlbum = profile.private_photos && profile.private_photos.length > 0;
  const hideActivityStatus = profile.hide_activity_status || false;

  // Calculate distance if both locations available
  let distance: string | null = null;
  let distanceKm: number | null = null;
  let distanceColors: { bg: string; text: string; icon: string } | null = null;

  if (userLocation && profile.latitude && profile.longitude) {
    distanceKm = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      profile.latitude,
      profile.longitude
    );
    distance = formatDistance(distanceKm);
    distanceColors = getDistanceColor(distanceKm);
  }

  // Get highlight label text
  const getHighlightLabel = () => {
    if (highlightType === 'active') return 'Activo ahora';
    if (highlightType === 'featured') return 'Destacado';
    return null;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "profile-card relative w-full group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background rounded-lg",
        compact ? "aspect-square" : "aspect-[4/5]",
        isNowPick && "ring-2 ring-primary nowpick-card-glow",
        isHighlighted && "explore-highlight-glow"
      )}
    >
      {/* Skeleton loader */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-secondary animate-pulse rounded-lg" />
      )}

      {/* Photo with scale effect */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <img
          src={mainPhoto}
          alt={profile.display_name}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          className={cn(
            "w-full h-full object-cover transition-transform duration-400 ease-out",
            isHovered && "scale-105",
            !imageLoaded && "opacity-0"
          )}
        />
      </div>

      {/* Gradient overlay - improved for legibility */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg transition-opacity duration-300",
          "bg-gradient-to-t from-black/85 via-black/30 to-transparent"
        )}
      />

      {/* Top indicators */}
      <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
        {/* Left: Presence / Status Badge - MOVED TO TOP */}
        <div className="flex flex-col gap-1 items-start">
          {!isInvisible && !hideActivityStatus && (
            <div className="bg-black/40 backdrop-blur-md rounded-full px-2 py-1 flex items-center">
              <PresenceIndicator
                lastActive={profile.last_active || null}
                isOnline={isOnline || false}
                isPrime={viewerIsPrime}
                hideActivityStatus={hideActivityStatus}
                isInvisible={isInvisible || false}
                variant="text"
                size="sm"
              />
            </div>
          )}

          {/* Highlight label below status if needed */}
          {isHighlighted && !isNowPick && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-primary/90 px-2 py-0.5 rounded-sm shadow-sm explore-highlight-label">
              {getHighlightLabel()}
            </span>
          )}
        </div>

        {/* Right indicators: Prime + Private album */}
        <div className="flex items-center gap-1.5">
          {hasPrivateAlbum && (
            <div className="p-1.5 bg-black/40 backdrop-blur-md rounded-full" title="Álbum privado">
              <Lock className="w-3 h-3 text-white/90" />
            </div>
          )}
          {isPrime && (
            <div className="p-1.5 bg-prime/80 backdrop-blur-md rounded-full shadow-lg border border-white/20">
              <Crown className="w-3 h-3 text-white animate-prime-shimmer" />
            </div>
          )}
        </div>
      </div>

      {/* NowPick Boost indicator - centered at top with enhanced styling */}
      {isNowPick && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 px-3 py-0.5 rounded-full shadow-xl flex items-center gap-1.5 border border-white/20 z-10">
          <Zap className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
          <span className="text-[10px] font-black text-white tracking-widest uppercase drop-shadow-sm">NOWPICK</span>
        </div>
      )}

      {/* Bottom info - Redesigned Hierarchy */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pt-12 text-left bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {/* Interest tags floating above */}
        {profile.intention_tags && profile.intention_tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mb-2">
            {profile.intention_tags.slice(0, 2).map((tagId) => {
              const option = INTEREST_OPTIONS.find(o => o.id === tagId);
              return option ? (
                <span
                  key={tagId}
                  className="text-[9px] font-medium bg-white/10 backdrop-blur-sm border border-white/10 text-white px-2 py-0.5 rounded-full"
                >
                  {option.emoji} {option.label}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* Primary: Name and Age */}
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className={cn(
            "font-bold text-white leading-none drop-shadow-lg",
            compact ? "text-base" : "text-xl"
          )}>
            {profile.display_name}, <span className="font-medium opacity-95">{profile.age}</span>
          </h3>
        </div>

        {/* Secondary: Distance */}
        {distance && (
          <div className="flex items-center gap-1 text-white/70">
            <MapPin className="w-3 h-3" />
            <span className={cn(
              "font-medium drop-shadow-md",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {compact ? distance : `A ${distance} de ti`}
            </span>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg border-2 transition-all duration-200 pointer-events-none",
          isHovered ? "border-primary/60 bg-primary/5" : "border-transparent"
        )}
      />
    </button>
  );
};

export default ProfileCard;
