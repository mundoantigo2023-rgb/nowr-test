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
  hideDistance?: boolean; // New prop to hide distance on grid
  variant?: 'default' | 'forYou'; // Variant for different visual styles
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

// Get distance color based on proximity (kept for consistency if needed later)
const getDistanceColor = (km: number): { bg: string; text: string; icon: string } => {
  if (km < 2) {
    return { bg: "bg-green-500/80", text: "text-white", icon: "text-white" };
  } else if (km <= 10) {
    return { bg: "bg-amber-500/80", text: "text-white", icon: "text-white" };
  } else {
    return { bg: "bg-black/50", text: "text-white/80", icon: "text-white/60" };
  }
};

const ProfileCard = ({ profile, onClick, compact = false, userLocation, isHighlighted = false, highlightType, viewerIsPrime = false, hideDistance = false, variant = 'default' }: ProfileCardProps) => {
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

  if (userLocation && profile.latitude && profile.longitude) {
    distanceKm = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      profile.latitude,
      profile.longitude
    );
    distance = formatDistance(distanceKm);
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
        "profile-card relative w-full group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background rounded-lg overflow-hidden",
        compact ? "aspect-[4/5]" : "aspect-[4/5]", // Enforce 4:5 everywhere for consistency
        isNowPick && "ring-2 ring-primary nowpick-card-glow",
        variant === 'forYou' && "ring-2 ring-brand-gradient shadow-[0_0_15px_rgba(255,215,0,0.3)]", // Gold/Brand glow for For You
        isHighlighted && variant !== 'forYou' && "explore-highlight-glow"
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

      {/* Gradient overlay - darker at bottom for text legibility */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg transition-opacity duration-300",
          "bg-gradient-to-t from-black/90 via-black/20 to-transparent"
        )}
      />

      {/* For You / Featured Badge */}
      {variant === 'forYou' && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20 uppercase tracking-wide">
            For You
          </span>
        </div>
      )}

      {/* Top indicators */}
      <div className="absolute top-2 right-2 flex items-start flex-col gap-1.5 z-10">
        {/* Status Badge (Online) */}
        {!isInvisible && !hideActivityStatus && isOnline && (
          <div className="self-end" title="Online">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-green-700"></span>
            </span>
          </div>
        )}

        {/* Prime + Private album icons */}
        <div className="flex items-center gap-1.5 self-end">
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

      {/* Bottom info - Clean Hierarchy (Name + Age only) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        {/* Name and Age */}
        <div className="flex items-end gap-1.5 mb-0.5 w-full">
          <h3 className={cn(
            "font-bold text-white leading-tight drop-shadow-md truncate max-w-[80%]",
            compact ? "text-sm" : "text-lg"
          )}>
            {profile.display_name}
          </h3>
          <span className="font-normal text-white/90 text-sm mb-[1px]">{profile.age}</span>
        </div>

        {/* Distance - Conditionally Rendered */}
        {!hideDistance && distance && (
          <div className="flex items-center gap-1 text-white/70 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className={cn(
              "font-medium drop-shadow-md",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {distance}
            </span>
          </div>
        )}

        {/* Highlight label for active users if NOT hiding distance (e.g. standard view) */}
        {!hideDistance && isHighlighted && !isNowPick && variant !== 'forYou' && (
          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-white/90 bg-white/20 px-1.5 py-0.5 rounded-sm">
            {getHighlightLabel()}
          </span>
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
