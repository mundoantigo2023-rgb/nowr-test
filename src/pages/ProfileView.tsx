import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProfileVisitors } from "@/hooks/useProfileVisitors";
import {
  ArrowLeft,
  MoreHorizontal,
  Crown,
  MapPin,
  Flag,
  Ban,
  MessageCircle,
  Flame,
  ChevronDown,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PresenceIndicator from "@/components/PresenceIndicator";

interface Profile {
  user_id: string;
  display_name: string;
  age: number;
  city: string | null;
  short_description: string | null;
  intention_tags: string[];
  photos: string[];
  online_status: boolean | null;
  is_prime: boolean | null;
  latitude: number | null;
  longitude: number | null;
  last_active: string | null;
  invisible_mode: boolean | null;
  hide_activity_status: boolean | null;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get proximity color based on distance
function getProximityColor(distance: number | null): {
  bg: string;
  text: string;
  label: string;
} {
  if (distance == null) {
    return { bg: "bg-muted", text: "text-muted-foreground", label: "Ubicación no disponible" };
  }
  if (distance < 2) {
    return { bg: "bg-emerald-500/15", text: "text-emerald-500", label: "Muy cerca" };
  }
  if (distance <= 10) {
    return { bg: "bg-amber-500/15", text: "text-amber-500", label: "Cerca" };
  }
  return { bg: "bg-muted", text: "text-muted-foreground", label: "Lejos" };
}

import { AVAILABILITY_OPTIONS, INTEREST_OPTIONS } from "@/lib/profileOptions";

// Get tag label from options
const getTagLabel = (tagId: string): string => {
  const availability = AVAILABILITY_OPTIONS.find(o => o.id === tagId);
  if (availability) return availability.label;
  
  const interest = INTEREST_OPTIONS.find(o => o.id === tagId);
  if (interest) return `${interest.emoji} ${interest.label}`;
  
  return tagId;
};

const ProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasInterest, setHasInterest] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [sendingInterest, setSendingInterest] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [interactionEnabled, setInteractionEnabled] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });
  const [isPhotoTransitioning, setIsPhotoTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [scrollY, setScrollY] = useState(0);
  const [currentUserIsPrime, setCurrentUserIsPrime] = useState(false);
  
  // Profile visitors hook - for recording views
  const { recordView } = useProfileVisitors(currentUserId || undefined, false);
  
  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Parallax effect on scroll (using window scroll)
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Prevent "carry-over" taps/clicks right after navigation into the profile
    // (common on mobile: the release/click happens after route change)
    setInteractionEnabled(false);
    const t = window.setTimeout(() => setInteractionEnabled(true), 350);
    return () => window.clearTimeout(t);
  }, [userId]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/");
        return;
      }
      setCurrentUserId(session.user.id);

      // Fetch current user's location and prime status
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("latitude, longitude, is_prime")
        .eq("user_id", session.user.id)
        .single();

      if (currentUserProfile) {
        setCurrentUserLocation({
          latitude: currentUserProfile.latitude,
          longitude: currentUserProfile.longitude,
        });
        setCurrentUserIsPrime(currentUserProfile.is_prime || false);
      }
      if (!userId) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        navigate("/home");
        return;
      }

      setProfile(profileData);

      const { data: interestData } = await supabase
        .from("interests")
        .select("id")
        .eq("from_user_id", session.user.id)
        .eq("to_user_id", userId)
        .maybeSingle();

      setHasInterest(!!interestData);

      const { data: matchData } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user_a.eq.${session.user.id},user_b.eq.${userId}),and(user_a.eq.${userId},user_b.eq.${session.user.id})`)
        .maybeSingle();

      setIsMatched(!!matchData);
      setLoading(false);
      
      // Record profile view (for Prime visitors feature)
      recordView(userId);
    };

    fetchData();
  }, [userId, navigate]);

  const handleSendInterest = async () => {
    if (!currentUserId || !userId || sendingInterest) return;
    setSendingInterest(true);

    try {
      await supabase
        .from("interests")
        .insert({ from_user_id: currentUserId, to_user_id: userId });

      const { data: mutualInterest } = await supabase
        .from("interests")
        .select("id")
        .eq("from_user_id", userId)
        .eq("to_user_id", currentUserId)
        .maybeSingle();

      if (mutualInterest) {
        await supabase
          .from("matches")
          .insert({ user_a: currentUserId, user_b: userId });

        setIsMatched(true);
        navigate("/match", { state: { matchedProfile: profile } });
      } else {
        setHasInterest(true);
        toast({
          title: "Tap enviado ⚡",
          description: `Si ${profile?.display_name} también te da Tap, empezará la conversación.`,
        });
      }
    } catch (error) {
      console.error("Error sending interest:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el interés",
        variant: "destructive",
      });
    } finally {
      setSendingInterest(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUserId || !userId) return;

    try {
      await supabase
        .from("blocks")
        .insert({ blocker_id: currentUserId, blocked_id: userId });

      toast({
        title: "Usuario bloqueado",
        description: "Has bloqueado a este usuario. No volverá a aparecer.",
      });
      navigate("/home");
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleReport = async () => {
    if (!currentUserId || !userId || !reportReason) return;

    try {
      await supabase.from("reports").insert({
        reporter_id: currentUserId,
        reported_user_id: userId,
        reason: reportReason,
        details: reportDetails || null,
      });

      toast({
        title: "Reporte enviado",
        description: "Gracias por ayudarnos a mantener NOWR seguro.",
      });
      setShowReportDialog(false);
      setReportReason("");
      setReportDetails("");
    } catch (error) {
      console.error("Error reporting user:", error);
    }
  };

  const nextPhoto = () => {
    if (profile?.photos && currentPhoto < profile.photos.length - 1 && !isPhotoTransitioning) {
      setSlideDirection('left');
      setIsPhotoTransitioning(true);
      setTimeout(() => {
        setCurrentPhoto(currentPhoto + 1);
        setIsPhotoTransitioning(false);
      }, 150);
    }
  };

  const prevPhoto = () => {
    if (currentPhoto > 0 && !isPhotoTransitioning) {
      setSlideDirection('right');
      setIsPhotoTransitioning(true);
      setTimeout(() => {
        setCurrentPhoto(currentPhoto - 1);
        setIsPhotoTransitioning(false);
      }, 150);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isSwipeLeft = distance > minSwipeDistance;
    const isSwipeRight = distance < -minSwipeDistance;
    
    if (isSwipeLeft) {
      nextPhoto();
    } else if (isSwipeRight) {
      prevPhoto();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const photos = profile.photos.length > 0 
    ? profile.photos 
    : [`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`];

  const bioTruncated = profile.short_description && profile.short_description.length > 120;

  // Calculate distance between current user and profile
  const distance = calculateDistance(
    currentUserLocation.latitude,
    currentUserLocation.longitude,
    profile.latitude,
    profile.longitude
  );
  const proximity = getProximityColor(distance);

  // Calculate parallax offset (subtle effect)
  const parallaxOffset = Math.min(scrollY * 0.3, 40);
  const parallaxScale = 1 + Math.min(scrollY * 0.0005, 0.05);
  const parallaxOpacity = Math.max(1 - scrollY * 0.002, 0.7);

  return (
    <div className="min-h-screen bg-background animate-fade-in pb-28">
      {/* Header fixo com blur */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/home");
            }
          }}
          className="w-10 h-10 rounded-full bg-background/70 backdrop-blur-xl border border-border/60 hover:bg-background hover:scale-105 transition-all duration-150"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!interactionEnabled}
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-full bg-background/70 backdrop-blur-xl border border-border/60 hover:bg-background hover:scale-105 transition-all duration-150"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                if (!interactionEnabled) return;
                setShowReportDialog(true);
              }}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Flag className="w-4 h-4 mr-2" />
              Reportar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                if (!interactionEnabled) return;
                setShowBlockDialog(true);
              }}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Ban className="w-4 h-4 mr-2" />
              Bloquear
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>


      <main className="pt-16">
        {/* Foto principal (NO fullscreen): card + contain + 30–35% de altura */}
        <section className="px-4 flex justify-center">
          <div className="relative w-fit">
            {/* Prime subtle glow waves effect */}
            {profile.is_prime && (
              <>
                <div className="absolute -inset-2 rounded-3xl prime-glow-wave-1" />
                <div className="absolute -inset-2 rounded-3xl prime-glow-wave-2" />
              </>
            )}
            <div
              className={cn(
                "relative h-[32vh] max-h-[35vh] min-h-[240px] aspect-square rounded-3xl overflow-hidden bg-card border shadow-lg animate-scale-in touch-pan-y",
                profile.is_prime ? "border-primary/50" : "border-border"
              )}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              aria-label="Foto de perfil"
            >
            <img
              src={photos[currentPhoto]}
              alt={`Foto de perfil de ${profile.display_name}`}
              className={cn(
                "absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-200 ease-out will-change-transform",
                isPhotoTransitioning && slideDirection === 'left' && "opacity-0 translate-x-4",
                isPhotoTransitioning && slideDirection === 'right' && "opacity-0 -translate-x-4"
              )}
              style={{
                transform: `translateY(${parallaxOffset}px) scale(${parallaxScale})`,
                opacity: parallaxOpacity,
              }}
              loading="eager"
              decoding="async"
            />

            {/* Indicadores tipo stories (sin invadir la imagen) */}
            {photos.length > 1 && (
              <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
                {photos.map((_, idx) => (
                  <div key={idx} className="flex-1 h-0.5 rounded-full overflow-hidden bg-foreground/20">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        idx === currentPhoto
                          ? "w-full bg-foreground/80"
                          : idx < currentPhoto
                            ? "w-full bg-foreground/50"
                            : "w-0 bg-foreground/30",
                      )}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Navegação por toque nas laterais */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  className="absolute left-0 top-0 w-1/3 h-full z-10"
                  aria-label="Foto anterior"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  className="absolute right-0 top-0 w-1/3 h-full z-10"
                  aria-label="Próxima foto"
                />
              </>
            )}

            {/* Abrir visor (lightbox) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!interactionEnabled}
              onClick={(e) => {
                e.stopPropagation();
                if (!interactionEnabled) return;
                setPhotoViewerOpen(true);
              }}
              className="absolute bottom-3 right-3 z-20 h-10 w-10 rounded-full bg-background/70 backdrop-blur-md border border-border/60 hover:bg-background transition-all duration-150"
              aria-label="Abrir foto en visor"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            {/* Gradiente inferior suave para legibilidad */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
          </div>
        </section>

        {/* Contenido */}
        <section className="px-4 pt-5 pb-32">
          {/* Info principal */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              {/* Badge Prime encima del nombre */}
              {profile.is_prime && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-prime/15 border border-prime/25 mb-2">
                  <Crown className="w-3.5 h-3.5 text-prime animate-prime-shimmer" />
                  <span className="text-xs font-semibold text-prime">PRIME</span>
                </div>
              )}
              
              {/* Nombre y edad */}
              <div className="flex items-baseline gap-2 mb-1">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight truncate">
                  {profile.display_name}
                </h1>
                <span className="text-xl text-muted-foreground font-light">{profile.age}</span>
              </div>

              {/* Distancia / ciudad y online */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {/* Badge de distancia */}
                {distance != null ? (
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                      proximity.bg,
                      proximity.text
                    )}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>
                      {distance < 1
                        ? `${Math.round(distance * 1000)} m`
                        : `${distance.toFixed(1)} km`}
                    </span>
                  </div>
                ) : profile.city ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{profile.city}</span>
                  </div>
                ) : null}
                
                {/* Ciudad (si hay distancia, mostrar ciudad también) */}
                {distance != null && profile.city && (
                  <span className="text-muted-foreground text-sm truncate">
                    {profile.city}
                  </span>
                )}

                {/* Presence indicator */}
                <PresenceIndicator
                  lastActive={profile.last_active}
                  isOnline={profile.online_status || false}
                  isPrime={!!currentUserIsPrime}
                  hideActivityStatus={profile.hide_activity_status || false}
                  isInvisible={(profile.is_prime && profile.invisible_mode) || false}
                  variant="full"
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Bio con "ver más" */}
          {profile.short_description && (
            <div className="mb-5">
              <p className="text-foreground/85 text-sm leading-relaxed">
                {showFullBio || !bioTruncated
                  ? profile.short_description
                  : `${profile.short_description.slice(0, 120)}...`}
              </p>
              {bioTruncated && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="mt-1 text-primary text-sm font-medium inline-flex items-center gap-1 hover:text-primary/80 transition-colors"
                >
                  {showFullBio ? "Ver menos" : "Ver más"}
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      showFullBio && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>
          )}

          {/* Tags de intención */}
          {profile.intention_tags && profile.intention_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {profile.intention_tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-muted-foreground text-xs font-medium"
                >
                  {getTagLabel(tag)}
                </span>
              ))}
            </div>
          )}

          {/* Galería de miniaturas */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPhoto(idx)}
                  className={cn(
                    "relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-150",
                    idx === currentPhoto
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                      : "opacity-70 hover:opacity-100",
                  )}
                  aria-label={`Ver foto ${idx + 1}`}
                >
                  <img
                    src={photo}
                    alt={`Miniatura de foto ${idx + 1} de ${profile.display_name}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </main>



      {/* Barra de acciones flotante con glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none">
        <div
          className={cn(
            "mx-auto max-w-md bg-background/70 backdrop-blur-xl border border-border/60 rounded-2xl p-3 shadow-lg",
            interactionEnabled ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {/* Chat */}
            {isMatched && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/matches");
                }}
                className="w-12 h-12 rounded-xl"
                aria-label="Abrir chat"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            )}

            {/* Tap (sin corazón) */}
            <Button
              type="button"
              variant={hasInterest ? "secondary" : "prime"}
              onClick={(e) => {
                e.stopPropagation();
                handleSendInterest();
              }}
              disabled={hasInterest || sendingInterest || isMatched}
              className="h-12 px-8 rounded-xl font-semibold transition-all duration-150 active:scale-95"
            >
              <Flame className={cn("w-5 h-5", hasInterest ? "opacity-50" : "animate-flame-pulse")} />
              {hasInterest ? "Tap enviado" : isMatched ? "Match ✓" : "Tap"}
            </Button>


            {/* Reportar */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowReportDialog(true);
              }}
              className="w-12 h-12 rounded-xl"
              aria-label="Reportar"
            >
              <Flag className="w-5 h-5" />
            </Button>

            {/* Bloquear */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowBlockDialog(true);
              }}
              className="w-12 h-12 rounded-xl"
              aria-label="Bloquear"
            >
              <Ban className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>



      {/* Visor de foto (lightbox secundario) */}
      <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
        <DialogContent className="bg-card border-border p-0 overflow-hidden">
          <div className="bg-muted">
            <img
              src={photos[currentPhoto]}
              alt={`Foto ampliada de ${profile.display_name}`}
              className="w-full max-h-[80vh] object-contain p-4"
              loading="eager"
              decoding="async"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Report */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Reportar usuario</DialogTitle>
            <DialogDescription>
              ¿Por qué quieres reportar este perfil?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inappropriate" id="inappropriate" />
                <Label htmlFor="inappropriate">Comportamiento inapropiado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fake" id="fake" />
                <Label htmlFor="fake">Perfil falso</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harassment" id="harassment" />
                <Label htmlFor="harassment">Acoso</Label>
              </div>
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor="details">Detalles (opcional)</Label>
              <Textarea
                id="details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe la situación..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReport} disabled={!reportReason} variant="destructive">
              Enviar reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert de Block */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Bloquear usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya no podrás ver ni interactuar con este perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ProfileView;
