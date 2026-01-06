import { useState } from "react";
import { Lock, Unlock, Loader2, Check, X, Images, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatAlbumAccessProps {
  // Other user (who we're chatting with)
  otherUserId: string;
  otherUserName: string;
  otherUserPhotos: string[];
  
  // Access status
  hasAccessToOther: boolean;
  hasPendingToOther: boolean;
  otherHasAccessToMe: boolean;
  otherHasPendingToMe: boolean;
  
  // My private photos
  myPrivatePhotos: string[];
  
  // Actions
  onRequestAccess: () => Promise<boolean>;
  onGrantAccess: () => Promise<boolean>;
  onDenyAccess: () => Promise<boolean>;
  onRevokeAccess: () => Promise<boolean>;
  
  loading?: boolean;
}

const ChatAlbumAccess = ({
  otherUserId,
  otherUserName,
  otherUserPhotos,
  hasAccessToOther,
  hasPendingToOther,
  otherHasAccessToMe,
  otherHasPendingToMe,
  myPrivatePhotos,
  onRequestAccess,
  onGrantAccess,
  onDenyAccess,
  onRevokeAccess,
  loading = false,
}: ChatAlbumAccessProps) => {
  const { toast } = useToast();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<boolean>, actionType: string, successMsg: string) => {
    setActionLoading(actionType);
    const success = await action();
    setActionLoading(null);
    
    if (success) {
      toast({ title: successMsg });
    } else {
      toast({ title: "Error", description: "No se pudo completar la acción", variant: "destructive" });
    }
  };

  const hasOtherAlbum = otherUserPhotos && otherUserPhotos.length > 0;
  const hasMyAlbum = myPrivatePhotos && myPrivatePhotos.length > 0;

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Images className="w-4 h-4 text-primary" />
        Álbum privado
      </div>

      {/* Other user's album - Request access or view */}
      {hasOtherAlbum && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
              {hasAccessToOther ? (
                <img 
                  src={otherUserPhotos[0]} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Álbum de {otherUserName}</p>
              <p className="text-xs text-muted-foreground">
                {hasAccessToOther 
                  ? `${otherUserPhotos.length} fotos disponibles`
                  : hasPendingToOther 
                    ? "Solicitud pendiente" 
                    : `${otherUserPhotos.length} fotos privadas`
                }
              </p>
            </div>
          </div>
          
          {hasAccessToOther ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setViewerOpen(true)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
          ) : hasPendingToOther ? (
            <span className="text-xs text-primary px-3 py-1.5 rounded-full bg-primary/10">
              Esperando
            </span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAction(onRequestAccess, "request", "Solicitud enviada")}
              disabled={loading || actionLoading === "request"}
            >
              {actionLoading === "request" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-1" />
                  Solicitar
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Incoming request from other user */}
      {hasMyAlbum && otherHasPendingToMe && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{otherUserName} quiere ver tu álbum</p>
              <p className="text-xs text-muted-foreground">
                {myPrivatePhotos.length} fotos privadas
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => handleAction(onDenyAccess, "deny", "Solicitud rechazada")}
              disabled={loading || actionLoading === "deny"}
            >
              {actionLoading === "deny" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 gradient-primary"
              onClick={() => handleAction(onGrantAccess, "grant", "Acceso concedido")}
              disabled={loading || actionLoading === "grant"}
            >
              {actionLoading === "grant" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Status: other user has access to my album */}
      {hasMyAlbum && otherHasAccessToMe && !otherHasPendingToMe && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-online/20 flex items-center justify-center">
              <Unlock className="w-4 h-4 text-online" />
            </div>
            <div>
              <p className="text-sm font-medium">{otherUserName} puede ver tu álbum</p>
              <p className="text-xs text-muted-foreground">
                {myPrivatePhotos.length} fotos compartidas
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => handleAction(onRevokeAccess, "revoke", "Acceso revocado")}
            disabled={loading || actionLoading === "revoke"}
          >
            {actionLoading === "revoke" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Revocar"
            )}
          </Button>
        </div>
      )}

      {/* Album viewer dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-lg p-0 bg-card border-border overflow-hidden">
          <DialogHeader className="p-4 border-b border-border/30">
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-primary" />
              Álbum privado de {otherUserName}
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <div className="aspect-[4/5] bg-black">
              <img
                src={otherUserPhotos[currentIndex]}
                alt={`Foto ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {otherUserPhotos.length > 1 && (
              <>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {otherUserPhotos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === currentIndex
                          ? "bg-primary w-6"
                          : "bg-white/50 hover:bg-white/70"
                      )}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentIndex(i => i === 0 ? otherUserPhotos.length - 1 : i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentIndex(i => i === otherUserPhotos.length - 1 ? 0 : i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                >
                  →
                </button>
              </>
            )}

            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
              {currentIndex + 1} / {otherUserPhotos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatAlbumAccess;
