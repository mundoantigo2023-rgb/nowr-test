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
  show_age: boolean | null;
  private_photos: string[] | null;
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
      const { data: profileDataResponse } = await supabase
        .from("profiles")
        .select("latitude, longitude, is_prime")
        .eq("user_id", session.user.id)
        .single();

      const currentUserProfile = profileDataResponse as any;

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
        .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${session.user.id})`)
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
      await (supabase
        .from("interests") as any)
        .insert({ from_user_id: currentUserId, to_user_id: userId });

      const { data: mutualInterest } = await supabase
        .from("interests")
        .select("id")
        .eq("from_user_id", userId)
        .eq("to_user_id", currentUserId)
        .maybeSingle();

      if (mutualInterest) {
        await (supabase
          .from("matches") as any)
          .insert({ user1_id: currentUserId, user2_id: userId });

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
      await (supabase
        .from("blocks") as any)
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
      await (supabase.from("reports") as any).insert({
        reporter_id: currentUserId,
        reported_id: userId,
        reason: reportReason,
        description: reportDetails || null,
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
    <div className="min-h-screen bg-background relative">
      <main className="pt-0 pb-32">
        {/* Top Navigation */}
        <div className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/home")}
            className="rounded-full hover:bg-secondary/50"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary/50">
                <MoreHorizontal className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-destructive">
                <Flag className="w-4 h-4 mr-2" /> Reportar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-destructive">
                <Ban className="w-4 h-4 mr-2" /> Bloquear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-4 max-w-lg mx-auto relative">
          {/* PROFILE PHOTO - Mobile First Layout: ~50% Viewport */}
          <div className="relative w-full aspect-[4/5] max-h-[50vh] md:max-h-[55vh] mx-auto rounded-b-3xl md:rounded-3xl overflow-hidden shadow-md bg-secondary/30 touch-pan-y transition-all">
            {/* Photo Carousel */}
            <img
              src={photos[currentPhoto]}
              alt={profile.display_name}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-200",
                isPhotoTransitioning ? "opacity-80" : "opacity-100"
              )}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            {/* Gradient Overlay for Text Readability if needed */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none md:hidden" />

            {/* Carousel Indicators */}
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-2 z-10">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300 shadow-sm backdrop-blur-sm",
                      idx === currentPhoto ? "w-6 bg-white" : "w-1.5 bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Tap Navigation Areas */}
            {photos.length > 1 && (
              <>
                <div className="absolute top-0 bottom-0 left-0 w-1/3 z-10" onClick={prevPhoto} />
                <div className="absolute top-0 bottom-0 right-0 w-1/3 z-10" onClick={nextPhoto} />
              </>
            )}

            {/* Expand Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 z-20"
              onClick={() => setPhotoViewerOpen(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* PROFILE INFO - Organized Below */}
          <div className="mt-4 px-1 space-y-4 pb-8">
            {/* Header: Name & Age (Check show_age preference) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold flex items-center text-foreground tracking-tight">
                  {profile.display_name}
                  {(profile.show_age !== false) && (
                    <span className="ml-2 text-3xl font-normal text-muted-foreground">{profile.age}</span>
                  )}
                </h1>
                {profile.is_prime && <Crown className="w-6 h-6 text-prime animate-prime-shimmer" />}
              </div>

              {/* Online Status Line */}
              <div className="flex items-center gap-2 text-sm font-medium">
                {profile.online_status ? (
                  <span className="flex items-center gap-1.5 text-green-500">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    Conectado ahora
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-border" />
                    {profile.last_active ? "Activo recientemente" : "Desconectado"}
                  </span>
                )}
              </div>

              {/* Location Line - Distinct */}
              <div className="flex items-center gap-2 text-sm text-foreground/80 mt-1">
                <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                {distance !== null ? (
                  <span className="font-medium">A {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</span>
                ) : (
                  <span className="text-muted-foreground">Ubicación oculta</span>
                )}
                {profile.city && <span className="text-muted-foreground">• {profile.city}</span>}
              </div>
            </div>

            {/* Bio / Description */}
            <div className="pt-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">SOBRE MÍ</h3>
              {profile.short_description ? (
                <p className="text-base md:text-lg leading-relaxed text-white/90 whitespace-pre-wrap font-light">
                  {profile.short_description}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Sin descripción.
                </p>
              )}
            </div>

            {/* Interests / Tags */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">INTERESES</h3>
              {profile.intention_tags && profile.intention_tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.intention_tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full text-sm font-medium border border-white/10 text-white/90 transition-colors">
                      {getTagLabel(tag)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Sin intereses seleccionados.
                </p>
              )}
            </div>

            {/* Gallery Thumbnails if > 1 */}
            {photos.length > 1 && (
              <div className="pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">GALERÍA</h3>
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhoto(idx)}
                      className={cn(
                        "relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all shadow-sm",
                        currentPhoto === idx ? "border-primary scale-105" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Private Photos Section - Prime Feature */}
            {profile.is_prime && profile.private_photos && profile.private_photos.length > 0 && (
              <div className="pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    GALERÍA PRIVADA ({profile.private_photos.length})
                  </h3>
                  {!currentUserIsPrime && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-500/30">
                      Prime
                    </span>
                  )}
                </div>

                <div className="relative overflow-hidden rounded-xl aspect-[3/2] bg-zinc-900/50 group cursor-pointer border border-white/10">
                  {/* Blur Overlay if not authorized */}
                  <div className="absolute inset-0 backdrop-blur-xl bg-black/60 flex flex-col items-center justify-center p-6 text-center z-10">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">Fotos Privadas</h4>
                    <p className="text-gray-400 text-xs">
                      {currentUserIsPrime
                        ? "Solicita acceso para ver"
                        : "Mejora a Prime para solicitar acceso"}
                    </p>
                  </div>

                  {/* Background placeholder */}
                  <img
                    src={profile.private_photos[0]}
                    alt="Private content"
                    className="w-full h-full object-cover opacity-50 blur-lg"
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border z-50 safe-area-bottom">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-3">
          {/* Secondary Actions */}
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-2 hover:bg-secondary" onClick={handleBlock}>
            <Ban className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Main CTA */}
          {isMatched ? (
            <Button
              className="col-span-3 h-12 rounded-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={() => navigate("/matches")}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat
            </Button>
          ) : (
            <Button
              className={cn(
                "col-span-3 h-12 rounded-full text-base font-bold shadow-lg transition-all active:scale-95",
                hasInterest ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground shadow-primary/20"
              )}
              onClick={handleSendInterest}
              disabled={hasInterest || sendingInterest}
            >
              {hasInterest ? "Tap Enviado" : "Enviar Tap"}
              {!hasInterest && <Flame className="w-5 h-5 ml-2 fill-current" />}
            </Button>
          )}

          {/* Report Action */}
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-2 hover:bg-secondary" onClick={() => setShowReportDialog(true)}>
            <Flag className="h-5 w-5 text-muted-foreground" />
          </Button>
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
