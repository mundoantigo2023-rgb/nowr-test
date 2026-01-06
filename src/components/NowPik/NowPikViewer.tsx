import { useState, useEffect, useCallback } from "react";
import { X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface NowPikViewerProps {
  imageUrl: string;
  duration: number; // in seconds (5 or 10)
  senderName: string;
  onClose: () => void;
  onViewed: () => void;
}

const NowPikViewer = ({ imageUrl, duration, senderName, onClose, onViewed }: NowPikViewerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isVisible, setIsVisible] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Prevent screenshots and context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent PrintScreen and common screenshot shortcuts
    if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4"))) {
      e.preventDefault();
      setIsVisible(false);
    }
    // Close on Escape
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Timer countdown - only starts after image loads
  useEffect(() => {
    if (!imageLoaded) return;
    
    if (timeLeft <= 0) {
      onViewed();
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onClose, onViewed, imageLoaded]);

  // Handle visibility change (tab switch = close)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onViewed();
        onClose();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [onClose, onViewed]);

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <p className="text-white text-lg">Contenido no disponible</p>
      </div>
    );
  }

  const progress = imageLoaded ? (timeLeft / duration) * 100 : 100;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none"
      onContextMenu={handleContextMenu}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        {/* Sender info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{senderName}</p>
            <p className="text-white/60 text-xs">NowPik</p>
          </div>
        </div>

        {/* Timer and close */}
        <div className="flex items-center gap-3">
          {/* Timer indicator */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="hsl(256 100% 68%)"
                strokeWidth="3"
                strokeDasharray={100}
                strokeDashoffset={100 - progress}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
              {imageLoaded ? timeLeft : "..."}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              onViewed();
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Image - with anti-save measures */}
      <div
        className={cn(
          "relative w-full h-full flex items-center justify-center p-8 pointer-events-none transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
      >
        <img
          src={imageUrl}
          alt="NowPik"
          className="max-w-full max-h-full object-contain"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setIsVisible(false);
          }}
          draggable={false}
        />
        {/* Overlay to prevent interaction */}
        <div className="absolute inset-0" />
      </div>

      {/* Warning text */}
      <p className="absolute bottom-6 text-white/40 text-xs font-medium tracking-wide">
        CONTENIDO TEMPORAL • SE ELIMINARÁ AUTOMÁTICAMENTE
      </p>
    </div>
  );
};

export default NowPikViewer;