import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Camera, Clock, Send, X, Crown, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NowPikSenderProps {
  matchId: string;
  userId: string;
  onSend: (imageUrl: string, duration: number) => Promise<void>;
  disabled?: boolean;
  isPrime?: boolean;
}

const NowPikSender = ({ matchId, userId, onSend, disabled, isPrime }: NowPikSenderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<string>("5");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El tamaño máximo es 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Tipo inválido",
          description: "Solo se permiten imágenes",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!selectedFile || !userId || !matchId) return;
    
    setSending(true);
    
    try {
      // Upload to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${matchId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("nowpik-images")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get signed URL (valid for 1 hour)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("nowpik-images")
        .createSignedUrl(fileName, 3600);

      if (signedError || !signedData?.signedUrl) {
        throw new Error("Error al generar URL");
      }

      // Call the onSend callback with the signed URL
      await onSend(signedData.signedUrl, parseInt(duration));
      
      toast({
        title: "NowPik enviado",
        description: `Visible por ${duration} segundos`,
      });
      
      handleClose();
    } catch (error) {
      console.error("Error sending NowPik:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el NowPik",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDuration("5");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Free user upsell content
  const FreeUserContent = () => (
    <div className="space-y-5 py-4">
      {/* Upsell message */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-prime/30 to-prime/10 flex items-center justify-center mx-auto">
          <Camera className="h-8 w-8 text-prime" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Este momento merece privacidad.
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Las fotos temporales son Prime.
          </p>
        </div>
      </div>

      {/* Feature preview */}
      <div className="space-y-2 px-2">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <Clock className="h-4 w-4 text-prime shrink-0" />
          <span className="text-sm text-foreground">Desaparecen en 5s, 10s o 30s</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <Camera className="h-4 w-4 text-prime shrink-0" />
          <span className="text-sm text-foreground">Bloqueo de capturas de pantalla</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <Crown className="h-4 w-4 text-prime shrink-0" />
          <span className="text-sm text-foreground">Envío ilimitado con Prime</span>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={() => {
          handleClose();
          navigate("/prime");
        }}
        className="w-full h-12 bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground font-semibold shadow-lg shadow-prime/30"
      >
        <Crown className="h-4 w-4 mr-2" />
        Desbloquear NowPik
      </Button>
      
      <p className="text-xs text-muted-foreground/60 text-center italic">
        Cancela cuando quieras. Sin compromisos.
      </p>
    </div>
  );

  // Prime user content (full functionality)
  const PrimeUserContent = () => (
    <div className="space-y-5 py-4">
      {/* Explanation */}
      <p className="text-sm text-muted-foreground text-center">
        Contenido temporal. Visible solo por el tiempo que elijas.
      </p>

      {/* Image selection */}
      {!previewUrl ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <ImagePlus className="h-8 w-8 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Seleccionar imagen</span>
          <span className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP (máx. 5MB)</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-52 object-cover"
          />
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {/* Duration selection */}
      <div className="space-y-3 bg-secondary/50 rounded-xl p-4">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-primary" />
          Tiempo de visualización
        </Label>
        <RadioGroup value={duration} onValueChange={setDuration} className="flex gap-4">
          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${duration === "5" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
            <RadioGroupItem value="5" id="5s" className="sr-only" />
            <span className="text-lg font-semibold">5s</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${duration === "10" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
            <RadioGroupItem value="10" id="10s" className="sr-only" />
            <span className="text-lg font-semibold">10s</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${duration === "30" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
            <RadioGroupItem value="30" id="30s" className="sr-only" />
            <span className="text-lg font-semibold">30s</span>
          </label>
        </RadioGroup>
      </div>

      {/* Warning */}
      <p className="text-xs text-muted-foreground text-center">
        El contenido desaparecerá automáticamente después de ser visto.
      </p>

      {/* Prime badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-prime">
        <Crown className="h-3.5 w-3.5" />
        <span>Acceso ilimitado con Prime</span>
      </div>

      {/* Send button */}
      <Button
        onClick={handleSend}
        disabled={!selectedFile || sending}
        className="w-full h-12 gradient-primary font-medium"
      >
        {sending ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Enviar NowPik
          </>
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="text-primary hover:text-primary hover:bg-primary/10"
          title="NowPik - Contenido temporal"
        >
          <Camera className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            NowPik
            {!isPrime && (
              <span className="ml-auto text-xs bg-prime/20 text-prime px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Prime
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isPrime ? <PrimeUserContent /> : <FreeUserContent />}
      </DialogContent>
    </Dialog>
  );
};

export default NowPikSender;
