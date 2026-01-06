import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";
import { NowrIcon } from "@/components/NowrLogo";

const BANNER_DISMISSED_KEY = "nowr_install_banner_dismissed";

const InstallBanner = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, installApp, hasPrompt } = usePWAInstall();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() => {
    const stored = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (!stored) return false;
    // Auto-show again after 7 days
    const dismissedAt = parseInt(stored, 10);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < sevenDays;
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
  };

  const handleInstall = async () => {
    if (hasPrompt) {
      const success = await installApp();
      if (success) {
        handleDismiss();
      }
    }
  };

  // Don't show if installed or dismissed
  if (isInstalled || dismissed) return null;

  // Check if we're on a mobile device
  const isMobile = isIOS || isAndroid || /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // Don't show on desktop
  if (!isMobile) return null;

  // Determine what message to show
  const getInstructions = () => {
    if (isIOS) {
      return t("iosStep1Title") + " → " + t("iosStep2Title");
    }
    if (hasPrompt) {
      return t("installFree");
    }
    // Android without prompt - show manual instructions
    return "Menu ⋮ → Instalar app";
  };

  const getIcon = () => {
    return <NowrIcon size={24} className="text-primary drop-shadow-sm" />;
  };

  return (
    <div className="fixed bottom-20 left-2 right-2 z-40 animate-in slide-in-from-bottom-8 fade-in duration-500 ease-out">
      <div className="relative bg-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-3 shadow-2xl overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-violet/20 to-primary/20 rounded-2xl blur-xl opacity-50 animate-pulse" />

        <div className="relative flex items-center gap-3">
          {/* Icon with glow */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 animate-in zoom-in-75 duration-300 delay-150">
            {getIcon()}
          </div>

          {/* Text with staggered animation */}
          <div className="flex-1 min-w-0 animate-in slide-in-from-left-4 duration-300 delay-200">
            <p className="text-sm font-semibold text-foreground truncate">
              {t("installApp")}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getInstructions()}
            </p>
          </div>

          {/* Actions with animation */}
          <div className="flex items-center gap-2 shrink-0 animate-in fade-in duration-300 delay-300">
            {hasPrompt && !isIOS ? (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200"
                onClick={handleInstall}
              >
                {t("installNow")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-primary text-xs px-3 hover:bg-primary/10 transition-all duration-200"
                onClick={handleDismiss}
              >
                OK
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;