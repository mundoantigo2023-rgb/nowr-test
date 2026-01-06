import { cn } from "@/lib/utils";
import { getPresenceInfo, getPresenceLabel, PresenceStatus } from "@/hooks/usePresence";
import { useLanguage } from "@/contexts/LanguageContext";

interface PresenceIndicatorProps {
  lastActive: string | null;
  isOnline: boolean | null;
  isPrime?: boolean; // Viewer is Prime (can see exact times)
  hideActivityStatus?: boolean; // Profile owner hides their status
  isInvisible?: boolean; // Profile owner is in invisible mode
  variant?: "dot" | "text" | "full"; // dot = green dot, text = just text, full = dot + text
  className?: string;
  size?: "sm" | "md";
}

const statusColors: Record<PresenceStatus, string> = {
  online: "bg-online",
  recent: "bg-emerald-400",
  hours: "bg-amber-400",
  yesterday: "bg-muted-foreground/60",
  days: "bg-muted-foreground/40",
};

const PresenceIndicator = ({
  lastActive,
  isOnline,
  isPrime = false,
  hideActivityStatus = false,
  isInvisible = false,
  variant = "full",
  className,
  size = "sm",
}: PresenceIndicatorProps) => {
  const { language } = useLanguage();
  
  // Don't show anything for invisible users or those who hide status
  if (isInvisible || hideActivityStatus) {
    return null;
  }

  const presence = getPresenceInfo(lastActive, isOnline, hideActivityStatus);

  if (!presence) {
    return null;
  }

  // Choose label based on viewer's Prime status and language
  const label = getPresenceLabel(presence, isPrime, language);

  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  // Just dot for online status
  if (variant === "dot") {
    if (presence.status !== "online") return null;
    return (
      <span 
        className={cn(
          dotSize, 
          "rounded-full ring-2 ring-black/40", 
          statusColors[presence.status],
          presence.status === "online" && "pulse-online",
          className
        )} 
      />
    );
  }

  // Just text
  if (variant === "text") {
    return (
      <span className={cn(textSize, "text-muted-foreground", className)}>
        {label}
      </span>
    );
  }

  // Full variant: dot for online, text badge for others
  if (presence.status === "online") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span 
          className={cn(
            dotSize, 
            "rounded-full ring-2 ring-black/40", 
            statusColors[presence.status],
            "pulse-online"
          )} 
        />
        <span className={cn(textSize, "text-online font-medium")}>
          {label}
        </span>
      </div>
    );
  }

  // Text badge for non-online states
  return (
    <span 
      className={cn(
        textSize,
        "bg-black/40 backdrop-blur-sm text-white/80 px-1.5 py-0.5 rounded-full",
        className
      )}
    >
      {label}
    </span>
  );
};

export default PresenceIndicator;
