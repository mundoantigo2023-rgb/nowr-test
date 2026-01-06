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
      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
        {/* Left: Highlight label */}
        <div className="flex items-center gap-1">
          {isHighlighted && !isNowPick && (
            <span className="text-[8px] font-medium text-primary-foreground bg-primary/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full explore-highlight-label">
              {getHighlightLabel()}
            </span>
          )}
        </div>

        {/* Right indicators: Prime + Private album */}
        <div className="flex items-center gap-1">
          {hasPrivateAlbum && (
            <div className="p-1 bg-black/40 backdrop-blur-sm rounded-full" title="Álbum privado">
              <Lock className="w-2.5 h-2.5 text-white/80" />
            </div>
          )}
          {isPrime && (
            <div className="p-1 bg-prime/30 backdrop-blur-sm rounded-full ring-1 ring-prime/50">
              <Crown className="w-2.5 h-2.5 text-prime animate-prime-shimmer" />
            </div>
          )}
        </div>
      </div>

      {/* NowPick Boost indicator - centered at top with enhanced styling */}
      {isNowPick && (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 border border-primary-foreground/20">
          <Zap className="w-3 h-3 text-primary-foreground animate-pulse" />
          <span className="text-[9px] font-bold text-primary-foreground tracking-wider uppercase">NowPick</span>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
        {/* Interest tags */}
        {profile.intention_tags && profile.intention_tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-0.5 mb-1">
            {profile.intention_tags.slice(0, 2).map((tagId) => {
              const option = INTEREST_OPTIONS.find(o => o.id === tagId);
              return option ? (
                <span 
                  key={tagId}
                  className="text-[8px] bg-white/20 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full"
                >
                  {option.emoji} {option.label}
                </span>
              ) : null;
            })}
            {profile.intention_tags.length > 2 && (
              <span className="text-[8px] bg-white/20 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full">
                +{profile.intention_tags.length - 2}
              </span>
            )}
          </div>
        )}
        
        {/* Presence indicator - above name */}
        {!isInvisible && !hideActivityStatus && (
          <div className="mb-0.5">
            <PresenceIndicator
              lastActive={profile.last_active || null}
              isOnline={isOnline || false}
              isPrime={viewerIsPrime}
              hideActivityStatus={hideActivityStatus}
              isInvisible={isInvisible || false}
              variant="full"
              size="sm"
            />
          </div>
        )}
        
        {/* Name, age, and distance row */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-baseline gap-1 min-w-0 flex-1">
            <span className={cn(
              "font-semibold text-white truncate drop-shadow-md",
              compact ? "text-xs" : "text-sm"
            )}>
              {profile.display_name}
            </span>
            <span className={cn(
              "text-white/85 font-medium drop-shadow-md shrink-0",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {profile.age}
            </span>
          </div>
          
          {/* Distance badge with color coding */}
          {distance && distanceColors && (
            <div className={cn(
              "flex items-center gap-0.5 backdrop-blur-sm px-1.5 py-0.5 rounded-full shrink-0",
              distanceColors.bg
            )}>
              <MapPin className={cn("w-2.5 h-2.5", distanceColors.icon)} />
              <span className={cn("text-[10px] font-medium", distanceColors.text)}>{distance}</span>
            </div>
          )}
        </div>
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
