import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface NowPickBoostProps {
  userId: string;
  isPrime: boolean;
  nowpickActiveUntil: string | null;
  nowpickLastUsed: string | null;
  onBoostActivated?: () => void;
}

const BOOST_DURATION_MINUTES = 15;
const FREE_COOLDOWN_DAYS = 7;

const NowPickBoost = ({ 
  userId, 
  isPrime, 
  nowpickActiveUntil, 
  nowpickLastUsed,
  onBoostActivated 
}: NowPickBoostProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [canBoost, setCanBoost] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  // Check if boost is currently active and update time remaining
  useEffect(() => {
    if (!nowpickActiveUntil) {
      setIsActive(false);
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const activeUntil = new Date(nowpickActiveUntil);
      const now = new Date();
      const diff = activeUntil.getTime() - now.getTime();

      if (diff <= 0) {
        setIsActive(false);
        setTimeRemaining(null);
        return;
      }

      setIsActive(true);
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    // Initial update
    updateTimer();
    
    // Set up interval for countdown
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nowpickActiveUntil]);

  // Check cooldown for free users
  useEffect(() => {
    if (isPrime) {
      setCanBoost(true);
      setCooldownRemaining(null);
      return;
    }

    if (!nowpickLastUsed) {
      setCanBoost(true);
      setCooldownRemaining(null);
      return;
    }

    const lastUsed = new Date(nowpickLastUsed);
    const cooldownEnd = new Date(lastUsed.getTime() + FREE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (cooldownEnd > now) {
      setCanBoost(false);
      const diff = cooldownEnd.getTime() - now.getTime();
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      setCooldownRemaining(`${days}d ${hours}h`);
    } else {
      setCanBoost(true);
      setCooldownRemaining(null);
    }
  }, [isPrime, nowpickLastUsed]);

  const activateBoost = async () => {
    if (loading || isActive || (!isPrime && !canBoost)) return;

    setLoading(true);
    try {
      const now = new Date();
      const activeUntil = new Date(now.getTime() + BOOST_DURATION_MINUTES * 60 * 1000);

      const { error } = await supabase
        .from("profiles")
        .update({
          nowpick_active_until: activeUntil.toISOString(),
          nowpick_last_used: now.toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      setIsActive(true);
      toast({
        title: t("nowPickActivated"),
        description: t("nowPickProfileHighlight").replace("{minutes}", String(BOOST_DURATION_MINUTES)),
      });

      // Show upsell for free users after using boost
      if (!isPrime) {
        setTimeout(() => setShowUpsell(true), 2000);
      }

      onBoostActivated?.();
    } catch (error) {
      console.error("Error activating boost:", error);
      toast({
        title: t("error"),
        description: t("nowPickActivateError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "relative rounded-xl p-4 border transition-all",
      isActive 
        ? "bg-primary/10 border-primary nowpick-glow" 
        : "bg-card border-border/50"
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-full transition-all",
            isActive ? "bg-primary animate-pulse" : "bg-secondary"
          )}>
            <Zap className={cn(
              "h-5 w-5",
              isActive ? "text-primary-foreground" : "text-primary"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              NowPick
              {isActive && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full animate-pulse">
                  {t("nowPickActive")}
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isActive 
                ? `${t("nowPickVisibleTop")} • ${timeRemaining} ${t("nowPickRemaining")}`
                : t("nowPickHighlight15Min")
              }
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {isActive ? (
            <div className="text-lg font-mono font-bold text-primary">
              {timeRemaining}
            </div>
          ) : canBoost ? (
            <Button
              onClick={activateBoost}
              disabled={loading}
              className={cn(
                "gap-2",
                isPrime && "bg-gradient-prime hover:opacity-90"
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {t("nowPickActivate")}
                </>
              )}
            </Button>
          ) : (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t("nowPickAvailableIn")}</p>
              <p className="text-sm font-medium text-foreground">{cooldownRemaining}</p>
            </div>
          )}
        </div>
      </div>

      {/* Free user hint */}
      {!isPrime && !isActive && !showUpsell && (
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Crown className="h-3.5 w-3.5 text-prime" />
            <span>{t("nowPickPrimeUnlimited")}</span>
          </div>
          {!canBoost && (
            <span className="text-xs text-muted-foreground">
              {t("nowPickOnceWeekFree")}
            </span>
          )}
        </div>
      )}

      {/* Upsell after boost used */}
      {showUpsell && !isPrime && (
        <div className="mt-3 pt-3 border-t border-prime/30 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-prime/20 shrink-0">
              <Zap className="h-4 w-4 text-prime" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t("nowPickProfileRising")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("nowPickBoostWhenever")}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/prime")}
            className="w-full bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground font-medium shadow-md shadow-prime/20"
          >
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            {t("nowPickUnlimitedBoost")}
          </Button>
          <p className="text-xs text-muted-foreground/60 text-center italic">
            {t("nowPickCancelAnytime")}
          </p>
        </div>
      )}
    </div>
  );
};

export default NowPickBoost;
