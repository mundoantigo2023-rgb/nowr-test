import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Plus, X, Loader2, Upload, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PrivateAlbumManagerProps {
  userId: string;
  privatePhotos: string[];
  onPhotosChange: (photos: string[]) => void;
}

const MAX_PRIVATE_PHOTOS = 6;

const PrivateAlbumManager = ({ userId, privatePhotos, onPhotosChange }: PrivateAlbumManagerProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PRIVATE_PHOTOS - privatePhotos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Límite alcanzado",
        description: `Máximo ${MAX_PRIVATE_PHOTOS} fotos en el álbum privado`,
        variant: "destructive",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        // Validate file
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

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("private-albums")
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
          .from("private-albums")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        const newPhotos = [...privatePhotos, ...uploadedUrls];

        // Update profile in database
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ private_photos: newPhotos })
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
            description: `${uploadedUrls.length} foto(s) añadida(s) al álbum privado`,
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
      const photoUrl = privatePhotos[index];

      // Extract file path from URL
      const urlParts = photoUrl.split("/private-albums/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("private-albums").remove([filePath]);
      }

      const newPhotos = privatePhotos.filter((_, i) => i !== index);

      const { error } = await supabase
        .from("profiles")
        .update({ private_photos: newPhotos })
        .eq("user_id", userId);

      if (error) throw error;

      onPhotosChange(newPhotos);
      toast({
        title: "Foto eliminada",
        description: "La foto se ha eliminado del álbum privado",
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

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Álbum privado
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            {privatePhotos.length}/{MAX_PRIVATE_PHOTOS}
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Solo visible para usuarios con tu permiso
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-2">
          {privatePhotos.map((photo, index) => (
            <div
              key={`${photo}-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden bg-secondary group"
            >
              <img
                src={photo}
                alt={`Foto privada ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Handle broken images
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                  const placeholder = document.createElement('div');
                  placeholder.className = 'text-muted-foreground text-xs text-center p-2';
                  placeholder.innerHTML = '<svg class="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>Error';
                  target.parentElement?.appendChild(placeholder);
                }}
              />
              <button
                onClick={() => handleDeletePhoto(index)}
                disabled={deletingIndex === index}
                className={cn(
                  "absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white",
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                  "hover:bg-destructive"
                )}
              >
                {deletingIndex === index ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}

          {/* Add photo button */}
          {privatePhotos.length < MAX_PRIVATE_PHOTOS && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "aspect-square rounded-lg border-2 border-dashed border-border/50",
                "flex flex-col items-center justify-center gap-1",
                "hover:border-primary/50 hover:bg-primary/5 transition-all",
                "text-muted-foreground hover:text-primary"
              )}
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  <span className="text-xs">Añadir</span>
                </>
              )}
            </button>
          )}
        </div>



        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default PrivateAlbumManager;
