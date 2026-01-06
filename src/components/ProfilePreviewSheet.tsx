import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, MapPin, X, Heart, MessageCircle, Flag, Ban, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePrivateAlbum } from "@/hooks/usePrivateAlbum";
import { useInteractionDelay } from "@/hooks/useInteractionDelay";
import PrivateAlbumViewer from "@/components/PrivateAlbumViewer";
import { INTEREST_OPTIONS } from "@/lib/profileOptions";

interface Profile {
  user_id: string;
  display_name: string;
  age: number;
  city?: string | null;
  photos: string[];
  online_status?: boolean | null;
  is_prime?: boolean | null;
  nowpick_active_until?: string | null;
  short_description?: string | null;
  intention_tags?: string[] | null;
  private_photos?: string[] | null;
  invisible_mode?: boolean | null;
}

interface ProfilePreviewSheetProps {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export const ProfilePreviewSheet = ({
  profile,
  open,
  onOpenChange,
  currentUserId,
}: ProfilePreviewSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isMatched, setIsMatched] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const { hasAccess, hasPendingRequest, requestAccess, loading: albumLoading } = usePrivateAlbum(currentUserId);
  
  // Prevent carry-over clicks by delaying interaction for 350ms after sheet opens
  const interactionEnabled = useInteractionDelay(open, 350);

  // Check if users are matched
  useEffect(() => {
    const checkMatch = async () => {
      if (!currentUserId || !profile) return;
      
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user_a.eq.${currentUserId},user_b.eq.${profile.user_id}),and(user_a.eq.${profile.user_id},user_b.eq.${currentUserId})`)
        .maybeSingle();
      
      if (match) {
        setIsMatched(true);
        setMatchId(match.id);
      } else {
        setIsMatched(false);
        setMatchId(null);
      }
    };
    
    if (open && profile) {
      checkMatch();
      setCurrentPhotoIndex(0);
    }
  }, [open, profile, currentUserId]);

  if (!profile) return null;

  // Hide online status for users in invisible mode (Prime feature)
  const isInvisible = profile.is_prime && profile.invisible_mode;
  const isOnline = isInvisible ? false : profile.online_status;
  const isPrime = profile.is_prime;
  const isNowPick = profile.nowpick_active_until && new Date(profile.nowpick_active_until) > new Date();
  const photos = profile.photos?.length > 0 
    ? profile.photos 
    : [`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`];
  const privatePhotos = profile.private_photos || [];
  const hasPrivateAlbum = privatePhotos.length > 0;

  const handleConnect = async () => {
    if (!currentUserId) return;
    setConnecting(true);

    try {
      const { data: existingInterest } = await supabase
        .from("interests")
        .select("id")
        .eq("from_user_id", currentUserId)
        .eq("to_user_id", profile.user_id)
        .maybeSingle();

      if (existingInterest) {
        toast({
          title: "Tap enviado",
          description: `Esperando que ${profile.display_name} también conecte contigo.`,
        });
        setConnecting(false);
        return;
      }

      await supabase.from("interests").insert({
        from_user_id: currentUserId,
        to_user_id: profile.user_id,
      });

      const { data: mutualInterest } = await supabase
        .from("interests")
        .select("id")
        .eq("from_user_id", profile.user_id)
        .eq("to_user_id", currentUserId)
        .maybeSingle();

      if (mutualInterest) {
        await supabase.from("matches").insert({
          user_a: currentUserId,
          user_b: profile.user_id,
        });

        onOpenChange(false);
        navigate("/match", { state: { matchedProfile: profile } });
      } else {
        toast({
          title: "Tap enviado ✓",
          description: `Si ${profile.display_name} también te da Tap, empezará la conversación.`,
        });
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el interés",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUserId) return;
    
    try {
      await supabase.from("blocks").insert({
        blocker_id: currentUserId,
        blocked_id: profile.user_id,
      });
      
      toast({
        title: "Usuario bloqueado",
        description: `${profile.display_name} ha sido bloqueado.`,
      });
      setBlockDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error blocking:", error);
      toast({
        title: "Error",
        description: "No se pudo bloquear al usuario",
        variant: "destructive",
      });
    }
  };

  const handleReport = async () => {
    if (!currentUserId || !reportReason) return;
    
    try {
      await supabase.from("reports").insert({
        reporter_id: currentUserId,
        reported_user_id: profile.user_id,
        reason: reportReason,
        details: reportDetails || null,
      });
      
      toast({
        title: "Reporte enviado",
        description: "Revisaremos tu reporte pronto.",
      });
      setReportDialogOpen(false);
      setReportReason("");
      setReportDetails("");
    } catch (error) {
      console.error("Error reporting:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el reporte",
        variant: "destructive",
      });
    }
  };

  const handleViewFullProfile = () => {
    onOpenChange(false);
    navigate(`/profile/${profile.user_id}`);
  };

  const handleOpenChat = () => {
    if (matchId) {
      onOpenChange(false);
      navigate(`/chat/${matchId}`);
    }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] rounded-t-3xl p-0 bg-card border-t border-border/30"
      >
        {/* Photo section - compact with better aspect ratio */}
        <div className="relative h-[35%] min-h-[180px] bg-secondary overflow-hidden">
          <img
            src={photos[currentPhotoIndex]}
            alt={profile.display_name}
            className="w-full h-full object-cover object-top"
          />
          
          {/* Stories-style progress indicators */}
          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30"
                >
                  <div
                    className={cn(
                      "h-full bg-white transition-all duration-300",
                      idx < currentPhotoIndex && "w-full",
                      idx === currentPhotoIndex && "w-full",
                      idx > currentPhotoIndex && "w-0"
                    )}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Photo navigation touch areas */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                className="absolute left-0 top-0 bottom-0 w-1/3 focus:outline-none z-10"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                className="absolute right-0 top-0 bottom-0 w-1/3 focus:outline-none z-10"
              />
            </>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Close button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-4 right-3 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white z-20"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Badges */}
          <div className="absolute top-4 left-3 flex gap-2">
            {isOnline && (
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 bg-online rounded-full pulse-online" />
                <span className="text-xs text-white font-medium">Ahora</span>
              </div>
            )}
            {isPrime && (
              <div className="prime-badge shadow-lg shadow-prime/30">
                <Crown className="w-3 h-3" />
                <span>PRIME</span>
              </div>
            )}
            {isNowPick && (
              <div className="bg-primary px-2.5 py-1 rounded-full">
                <span className="text-xs font-bold text-primary-foreground">NOW</span>
              </div>
            )}
          </div>
        </div>

        {/* Content section - scrollable */}
        <div className="p-4 space-y-3 overflow-y-auto h-[65%]">
          {/* Photo thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
              {photos.map((photo, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex(idx);
                  }}
                  className={cn(
                    "shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                    idx === currentPhotoIndex 
                      ? "border-primary ring-2 ring-primary/30" 
                      : "border-border/50 opacity-70 hover:opacity-100"
                  )}
                >
                  <img
                    src={photo}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Name and basic info */}
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold text-foreground">{profile.display_name}</h2>
              <span className="text-lg text-muted-foreground">{profile.age}</span>
            </div>
            {profile.city && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile.city}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.short_description && (
            <p className="text-muted-foreground leading-relaxed">{profile.short_description}</p>
          )}

          {/* Intention tags */}
          {profile.intention_tags && profile.intention_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.intention_tags.map((tag) => {
                const option = INTEREST_OPTIONS.find(o => o.id === tag);
                return (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-full border border-border/50"
                  >
                    {option ? `${option.emoji} ${option.label}` : tag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Private Album Section */}
          {hasPrivateAlbum && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Álbum privado</span>
              </div>
              <PrivateAlbumViewer
                ownerId={profile.user_id}
                ownerName={profile.display_name}
                privatePhotos={privatePhotos}
                hasAccess={hasAccess(profile.user_id)}
                hasPending={hasPendingRequest(profile.user_id)}
                onRequestAccess={() => requestAccess(profile.user_id)}
                loading={albumLoading}
              />
            </div>
          )}

          {/* Action bar */}
          <div className={cn("flex gap-3 pt-4", !interactionEnabled && "pointer-events-none")}>
            {isMatched ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenChat();
                }}
                disabled={!interactionEnabled}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Abrir chat
              </Button>
            ) : (
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnect();
                }}
                disabled={connecting || !interactionEnabled}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {connecting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-2" />
                    Tap
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleViewFullProfile();
              }}
              disabled={!interactionEnabled}
              className="flex-1 h-12"
            >
              Ver perfil
            </Button>
          </div>

          {/* Secondary actions */}
          <div className={cn("flex justify-center gap-6 pt-2 pb-4", !interactionEnabled && "pointer-events-none")}>
            <button 
              type="button"
              disabled={!interactionEnabled}
              onClick={(e) => {
                e.stopPropagation();
                setReportDialogOpen(true);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Flag className="w-3.5 h-3.5" />
              Reportar
            </button>
            <button 
              type="button"
              disabled={!interactionEnabled}
              onClick={(e) => {
                e.stopPropagation();
                setBlockDialogOpen(true);
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              Bloquear
            </button>
          </div>
        </div>
      </SheetContent>

      {/* Block Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear a {profile.display_name}</AlertDialogTitle>
            <AlertDialogDescription>
              No podrás ver su perfil ni recibir mensajes. Esta acción no se puede deshacer.
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

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Reportar a {profile.display_name}</DialogTitle>
            <DialogDescription>
              Selecciona el motivo del reporte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {["Perfil falso", "Contenido inapropiado", "Acoso", "Spam", "Otro"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-colors",
                    reportReason === reason
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border hover:border-primary/50"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Detalles adicionales (opcional)"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReport} disabled={!reportReason}>
              Enviar reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};

export default ProfilePreviewSheet;
