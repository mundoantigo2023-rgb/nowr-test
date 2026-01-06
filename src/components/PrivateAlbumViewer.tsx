import { useState } from "react";
import { Lock, Unlock, Loader2, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useInteractionDelay } from "@/hooks/useInteractionDelay";
import ProtectedImage from "@/components/ProtectedImage";

interface PrivateAlbumViewerProps {
  ownerId: string;
  ownerName: string;
  privatePhotos: string[];
  hasAccess: boolean;
  hasPending: boolean;
  onRequestAccess: () => Promise<boolean>;
  loading?: boolean;
}

const PrivateAlbumViewer = ({
  ownerId,
  ownerName,
  privatePhotos,
  hasAccess,
  hasPending,
  onRequestAccess,
  loading = false,
}: PrivateAlbumViewerProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [requesting, setRequesting] = useState(false);
  
  // Prevent carry-over clicks
  const interactionEnabled = useInteractionDelay(open, 350);

  const handleRequestAccess = async () => {
    setRequesting(true);
    const success = await onRequestAccess();
    setRequesting(false);

    if (success) {
      toast({
        title: "Solicitud enviada",
        description: `${ownerName} recibirá tu solicitud de acceso`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    }
  };

  if (!privatePhotos?.length) return null;

  return (
    <>
      {/* Album preview button */}
      <button
        onClick={() => setOpen(true)}
        className="relative group overflow-hidden rounded-lg aspect-square bg-secondary/50 border border-border/30 hover:border-primary/50 transition-all"
      >
        {hasAccess ? (
          <img
            src={privatePhotos[0]}
            alt="Álbum privado"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground text-center">
              Álbum privado
            </span>
            {hasPending && (
              <span className="text-xs text-primary">Pendiente</span>
            )}
          </div>
        )}
        
        {/* Photo count badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-medium">
          {privatePhotos.length} fotos
        </div>

        {/* Lock overlay for access view */}
        {hasAccess && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
            <span className="flex items-center gap-1 text-xs text-white">
              <Eye className="w-3 h-3" />
              Ver álbum
            </span>
          </div>
        )}
      </button>

      {/* Album dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 bg-card border-border overflow-hidden">
          <DialogHeader className="p-4 border-b border-border/30">
            <DialogTitle className="flex items-center gap-2">
              {hasAccess ? (
                <Unlock className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              Álbum privado de {ownerName}
            </DialogTitle>
          </DialogHeader>

          {hasAccess ? (
            <div className="relative">
              {/* Current photo with protection */}
              <ProtectedImage
                src={privatePhotos[currentIndex]}
                alt={`Foto privada ${currentIndex + 1}`}
                className="w-full h-full object-contain"
                containerClassName="aspect-[4/5] bg-black"
                showProtectionBadge={true}
              />

              {/* Navigation dots */}
              {privatePhotos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {privatePhotos.map((_, i) => (
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
              )}

              {/* Navigation arrows */}
              {privatePhotos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentIndex((i) =>
                        i === 0 ? privatePhotos.length - 1 : i - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() =>
                      setCurrentIndex((i) =>
                        i === privatePhotos.length - 1 ? 0 : i + 1
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                  >
                    →
                  </button>
                </>
              )}

              {/* Photo counter */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                {currentIndex + 1} / {privatePhotos.length}
              </div>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <EyeOff className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                Contenido privado
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Este álbum contiene {privatePhotos.length} fotos privadas. 
                Solicita acceso para verlas.
              </p>

              {hasPending ? (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Solicitud pendiente</span>
                </div>
              ) : (
                <Button
                  onClick={handleRequestAccess}
                  disabled={requesting || loading || !interactionEnabled}
                  className="gradient-primary"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Solicitando...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Solicitar acceso
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrivateAlbumViewer;
