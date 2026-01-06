import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Clock, Infinity, Plus, Unlock, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatTimePaywallProps {
  timeRemaining: number; // in milliseconds
  chatExpired: boolean;
  isPrime: boolean;
  otherUserName: string;
  onExtend?: () => void;
  onReopen?: () => void;
  onDismiss?: () => void;
}

type PaywallLevel = "none" | "banner" | "modal" | "fullscreen";

const ChatTimePaywall = ({
  timeRemaining,
  chatExpired,
  isPrime,
  otherUserName,
  onExtend,
  onReopen,
  onDismiss,
}: ChatTimePaywallProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [lastDismissedLevel, setLastDismissedLevel] = useState<PaywallLevel>("none");

  // Reset dismissed state when chat expires (force fullscreen)
  useEffect(() => {
    if (chatExpired) {
      setDismissed(false);
    }
  }, [chatExpired]);

  // Determine paywall level based on time
  const getPaywallLevel = (): PaywallLevel => {
    if (isPrime) return "none";
    if (chatExpired) return "fullscreen";
    if (timeRemaining <= 3 * 60 * 1000) return "modal"; // ≤3 min
    if (timeRemaining <= 10 * 60 * 1000) return "banner"; // ≤10 min
    return "none";
  };

  const paywallLevel = getPaywallLevel();

  // Don't show if dismissed (except fullscreen which can't be dismissed)
  if (dismissed && paywallLevel !== "fullscreen" && lastDismissedLevel === paywallLevel) {
    return null;
  }

  // Don't show if no paywall needed
  if (paywallLevel === "none") return null;

  const handleDismiss = () => {
    setDismissed(true);
    setLastDismissedLevel(paywallLevel);
    onDismiss?.();
  };

  const handleGoPrime = () => {
    navigate("/prime");
  };

  // Banner - Soft pre-urgency (≤10 min)
  if (paywallLevel === "banner") {
    return (
      <div className="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-r from-prime/10 to-primary/10 border border-prime/20 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Clock className="w-4 h-4 text-prime flex-shrink-0" />
            <p className="text-sm text-foreground">{t("paywallBannerText")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGoPrime}
              className="text-prime text-xs hover:bg-prime/10"
            >
              {t("paywallSeePrime")}
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal - Critical zone (≤3 min)
  if (paywallLevel === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl animate-scale-in">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-prime/20 to-primary/20 flex items-center justify-center">
              <Clock className="w-7 h-7 text-prime" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {t("paywallModalTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("paywallModalSubtitle")}
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Plus className="w-4 h-4 text-prime" />
              <span>{t("paywallBenefit30Min")}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Sparkles className="w-4 h-4 text-prime" />
              <span>{t("paywallBenefitNoInterruptions")}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Clock className="w-4 h-4 text-prime" />
              <span>{t("paywallBenefitTimeControl")}</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleGoPrime}
            className="w-full bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground font-medium shadow-lg shadow-prime/20"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t("paywallContinueWithPrime")}
          </Button>

          {/* Secondary */}
          <button
            onClick={handleDismiss}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("paywallMaybeLater")}
          </button>
        </div>
      </div>
    );
  }

  // Fullscreen - Post expiration
  if (paywallLevel === "fullscreen") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-background animate-fade-in">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-prime/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-sm">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-prime/20 to-primary/20 flex items-center justify-center border border-prime/30">
            <Clock className="w-10 h-10 text-prime" />
          </div>

          {/* Emotional title */}
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {t("paywallExpiredTitle")}
          </h2>
          
          <p className="text-muted-foreground mb-8">
            {t("paywallExpiredSubtitle")}
          </p>

          {/* Options */}
          <div className="space-y-3">
            <Button
              onClick={handleGoPrime}
              size="lg"
              className="w-full bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground font-semibold shadow-xl shadow-prime/30"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t("paywallAddTime")}
            </Button>
            
            <Button
              onClick={handleGoPrime}
              variant="outline"
              size="lg"
              className="w-full border-prime/30 text-prime hover:bg-prime/10"
            >
              <Unlock className="w-5 h-5 mr-2" />
              {t("paywallUnlockChat")}
            </Button>
            
            <Button
              onClick={handleGoPrime}
              variant="ghost"
              size="lg"
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <Infinity className="w-5 h-5 mr-2" />
              {t("paywallUnlimitedTime")}
            </Button>
          </div>

          {/* Go back */}
          <button
            onClick={() => navigate("/matches")}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("paywallBackToMatches")}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ChatTimePaywall;
