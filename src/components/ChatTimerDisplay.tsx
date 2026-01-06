import { useMemo } from "react";
import { Clock, AlertTriangle, Flame, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatTimerDisplayProps {
  timeRemaining: number; // in milliseconds
  timerExtended?: boolean;
  onTimeEvent?: (event: "time_warning_10" | "time_critical_5" | "time_expired") => void;
}

type TimerState = "active" | "attention" | "urgency" | "critical" | "final" | "expired";

const ChatTimerDisplay = ({ timeRemaining, timerExtended }: ChatTimerDisplayProps) => {
  const { t } = useLanguage();
  
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Determine timer state based on remaining time
  const timerState: TimerState = useMemo(() => {
    if (timeRemaining <= 0) return "expired";
    if (timeRemaining <= 60 * 1000) return "final"; // 1 min
    if (timeRemaining <= 5 * 60 * 1000) return "critical"; // 5 min
    if (timeRemaining <= 10 * 60 * 1000) return "urgency"; // 10 min
    if (timeRemaining <= 20 * 60 * 1000) return "attention"; // 20 min
    return "active"; // 30-20 min
  }, [timeRemaining]);

  // Get dynamic microcopy based on state
  const getMicrocopy = () => {
    switch (timerState) {
      case "active":
        return {
          label: t("timerActive"),
          sublabel: t("timerActiveHint"),
          icon: Clock,
        };
      case "attention":
        return {
          label: t("timerRemaining").replace("{time}", formattedTime),
          sublabel: t("timerAttentionHint"),
          icon: Clock,
        };
      case "urgency":
        return {
          label: t("timerLast").replace("{time}", formattedTime),
          sublabel: t("timerUrgencyHint"),
          icon: AlertTriangle,
        };
      case "critical":
        return {
          label: t("timerEnding").replace("{time}", formattedTime),
          sublabel: t("timerCriticalHint"),
          icon: Flame,
        };
      case "final":
        return {
          label: t("timerFinal"),
          sublabel: t("timerFinalHint"),
          icon: Timer,
        };
      case "expired":
        return {
          label: t("timerExpired"),
          sublabel: "",
          icon: Clock,
        };
    }
  };

  const microcopy = getMicrocopy();
  const IconComponent = microcopy.icon;

  // Style classes based on state
  const getStateStyles = () => {
    switch (timerState) {
      case "active":
        return "bg-muted text-muted-foreground";
      case "attention":
        return "bg-muted text-foreground";
      case "urgency":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
      case "critical":
        return "bg-orange-500/20 text-orange-600 dark:text-orange-400 animate-pulse";
      case "final":
        return "bg-destructive/20 text-destructive animate-pulse";
      case "expired":
        return "bg-destructive/30 text-destructive";
    }
  };

  const getIconStyles = () => {
    switch (timerState) {
      case "critical":
      case "final":
        return "animate-bounce";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
          timerExtended && "animate-timer-extended",
          getStateStyles()
        )}
      >
        <IconComponent className={cn("w-4 h-4", getIconStyles())} />
        <span className={cn(timerState === "final" && "animate-pulse")}>
          {timerState === "active" 
            ? microcopy.label 
            : timerState === "final" 
              ? microcopy.label 
              : formattedTime}
        </span>
      </div>
      
      {/* Subcopy tooltip - only show for attention and above */}
      {timerState !== "active" && timerState !== "expired" && microcopy.sublabel && (
        <span className={cn(
          "text-[10px] max-w-[140px] text-right leading-tight transition-opacity",
          timerState === "attention" && "text-muted-foreground",
          timerState === "urgency" && "text-amber-600/80 dark:text-amber-400/80",
          timerState === "critical" && "text-orange-600/80 dark:text-orange-400/80",
          timerState === "final" && "text-destructive/80"
        )}>
          {microcopy.sublabel}
        </span>
      )}
    </div>
  );
};

export default ChatTimerDisplay;
