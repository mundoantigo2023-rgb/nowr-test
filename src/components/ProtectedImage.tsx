import { useState, useRef, useEffect } from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  showProtectionBadge?: boolean;
}

/**
 * ProtectedImage - Renders an image with multiple layers of protection
 * against screenshots and downloads:
 * - Disables right-click context menu
 * - Disables drag and drop
 * - Adds invisible overlay to prevent direct interaction
 * - Adds subtle noise pattern that degrades screenshot quality
 * - Disables image selection
 * - Uses CSS to prevent saving
 */
const ProtectedImage = ({
  src,
  alt,
  className,
  containerClassName,
  showProtectionBadge = true,
}: ProtectedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent context menu on the entire container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventDrag = (e: Event) => {
      e.preventDefault();
      return false;
    };

    container.addEventListener("contextmenu", preventContextMenu);
    container.addEventListener("dragstart", preventDrag);

    return () => {
      container.removeEventListener("contextmenu", preventContextMenu);
      container.removeEventListener("dragstart", preventDrag);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none overflow-hidden",
        containerClassName
      )}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* The actual image */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "pointer-events-none select-none transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setLoaded(true)}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
      />

      {/* Invisible interaction blocker */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{ cursor: "default" }}
      />

      {/* Noise overlay - degrades screenshot quality */}
      <div
        className="absolute inset-0 z-20 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "150px 150px",
        }}
      />

      {/* Watermark pattern overlay */}
      <div
        className="absolute inset-0 z-20 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            rgba(255,255,255,0.1) 20px,
            rgba(255,255,255,0.1) 21px
          )`,
        }}
      />

      {/* Protection badge */}
      {showProtectionBadge && loaded && (
        <div className="absolute top-2 left-2 z-30 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80 text-[10px]">
          <Shield className="w-3 h-3" />
          <span>Protegido</span>
        </div>
      )}

      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-secondary animate-pulse" />
      )}
    </div>
  );
};

export default ProtectedImage;
