import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ChatPsychologicalMessageProps {
  timeRemaining: number; // in milliseconds
  chatExpired: boolean;
  isPrime: boolean;
}

type MessagePhase = "none" | "medium" | "high" | "critical" | "expired";

const ChatPsychologicalMessage = ({
  timeRemaining,
  chatExpired,
  isPrime,
}: ChatPsychologicalMessageProps) => {
  const { t } = useLanguage();

  // Determine phase based on time
  const phase: MessagePhase = useMemo(() => {
    if (isPrime) return "none";
    if (chatExpired) return "expired";
    if (timeRemaining <= 1 * 60 * 1000) return "critical"; // ≤1 min
    if (timeRemaining <= 5 * 60 * 1000) return "high"; // ≤5 min
    if (timeRemaining <= 10 * 60 * 1000) return "medium"; // ≤10 min (changed from 15)
    return "none";
  }, [timeRemaining, chatExpired, isPrime]);

  if (phase === "none") return null;

  const getMessage = () => {
    switch (phase) {
      case "medium":
        return t("psychMedium");
      case "high":
        return t("psychHigh");
      case "critical":
        return t("psychCritical");
      case "expired":
        return t("psychExpired");
      default:
        return "";
    }
  };

  const message = getMessage();
  if (!message) return null;

  return (
    <div
      className={cn(
        "text-center py-2 px-4 mx-4 my-2 rounded-lg text-sm italic transition-all animate-fade-in",
        phase === "medium" && "bg-muted/50 text-muted-foreground",
        phase === "high" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        phase === "critical" && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        phase === "expired" && "bg-primary/10 text-primary"
      )}
    >
      {message}
    </div>
  );
};

export default ChatPsychologicalMessage;
