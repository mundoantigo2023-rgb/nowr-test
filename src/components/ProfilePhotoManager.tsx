import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Plus, X, Loader2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProfilePhotoManagerProps {
  userId: string;
  photos: string[];
  isPrime: boolean;
  onPhotosChange: (photos: string[]) => void;
}

const MAX_PHOTOS = 4;

const ProfilePhotoManager = ({ userId, photos, isPrime, onPhotosChange }: ProfilePhotoManagerProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Límite alcanzado",
        description: `Máximo ${MAX_PHOTOS} fotos de perfil`,
        variant: "destructive",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Archivo no válido",
            description: "Solo se permiten imágenes",
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Archivo muy grande",
            description: "Máximo 5MB por imagen",
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split(".").pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Error al subir",
            description: "No se pudo subir la imagen",
            variant: "destructive",
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        const newPhotos = [...photos, ...uploadedUrls];
        
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ photos: newPhotos })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Update error:", updateError);
          toast({
            title: "Error",
            description: "No se pudo actualizar el perfil",
            variant: "destructive",
          });
        } else {
          onPhotosChange(newPhotos);
          toast({
            title: "Fotos añadidas",
            description: `${uploadedUrls.length} foto(s) añadida(s)`,
          });
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Error al subir las imágenes",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (index: number) => {
    setDeletingIndex(index);

    try {
      const photoUrl = photos[index];
      
      const urlParts = photoUrl.split("/profile-photos/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("profile-photos").remove([filePath]);
      }

      const newPhotos = photos.filter((_, i) => i !== index);
      
      const { error } = await supabase
        .from("profiles")
        .update({ photos: newPhotos })
        .eq("user_id", userId);

      if (error) throw error;

      onPhotosChange(newPhotos);
      toast({
        title: "Foto eliminada",
        description: "La foto se ha eliminado del perfil",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto",
        variant: "destructive",
      });
    } finally {
      setDeletingIndex(null);
    }
  };

  const mainPhoto = photos[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

  return (
    <Card className="border-border/30">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Main photo display */}
          <div className="relative">
            <img
              src={mainPhoto}
              alt="Foto principal"
              className="w-28 h-28 rounded-full object-cover border-4 border-border/50"
            />
            {isPrime && (
              <div className="absolute -top-1 -right-1 p-2 rounded-full bg-prime/90 shadow-lg shadow-prime/30">
                <Crown className="h-4 w-4 text-prime-foreground animate-prime-shimmer" />
              </div>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
              ) : (
                <Camera className="h-4 w-4 text-primary-foreground" />
              )}
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            Fotos ({photos.length}/{MAX_PHOTOS})
          </p>

          {/* Photo grid */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
            {photos.map((photo, index) => (
              <div
                key={`${photo}-${index}`}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden bg-secondary group",
                  index === 0 && "ring-2 ring-primary"
                )}
              >
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}-${index}`;
                  }}
                />
                <button
                  onClick={() => handleDeletePhoto(index)}
                  disabled={deletingIndex === index}
                  className={cn(
                    "absolute top-0.5 right-0.5 p-1 rounded-full bg-black/60 text-white",
                    "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                    "hover:bg-destructive"
                  )}
                >
                  {deletingIndex === index ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[8px] text-center py-0.5">
                    Principal
                  </div>
                )}
              </div>
            ))}

            {/* Add photo slots */}
            {Array.from({ length: MAX_PHOTOS - photos.length }).map((_, index) => (
              <button
                key={`empty-${index}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "aspect-square rounded-lg border-2 border-dashed border-border/50",
                  "flex items-center justify-center",
                  "hover:border-primary/50 hover:bg-primary/5 transition-all",
                  "text-muted-foreground hover:text-primary"
                )}
              >
                <Plus className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default ProfilePhotoManager;
