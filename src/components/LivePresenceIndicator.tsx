import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { WifiOff } from "lucide-react";
import { ActivityLevel } from "@/hooks/useCityActivity";

interface LivePresenceIndicatorProps {
  count: number;
  className?: string;
  label?: string;
  activityLevel?: ActivityLevel;
}

const LivePresenceIndicator = ({ count, className, label = "ahora", activityLevel }: LivePresenceIndicatorProps) => {
  const [pulse, setPulse] = useState(false);

  // Pulse animation every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) {
    return (
      <div className={cn("flex items-center gap-1.5 text-muted-foreground", className)}>
        <WifiOff className="w-3.5 h-3.5" />
        <span className="text-xs">Sin usuarios activos</span>
      </div>
    );
  }

  // Determine display based on activity level
  const isHighActivity = activityLevel === "high";
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div 
          className={cn(
            "w-2 h-2 rounded-full",
            isHighActivity ? "bg-primary" : "bg-online",
            pulse && "animate-ping absolute inset-0"
          )} 
        />
        <div className={cn("w-2 h-2 rounded-full", isHighActivity ? "bg-primary" : "bg-online")} />
      </div>
      <span className={cn("text-xs font-medium", isHighActivity ? "text-primary" : "text-online")}>
        {count} {count === 1 ? "usuario activo" : "usuarios activos"}
      </span>
    </div>
  );
};

// Hook to get live presence count
export function useLivePresence(currentUserId?: string) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchOnlineCount = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("online_status", true)
        .neq("user_id", currentUserId)
        .gte("last_active", fiveMinutesAgo);

      setOnlineCount(count || 0);
    };

    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 30000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  return onlineCount;
}

export default LivePresenceIndicator;
