import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const COOKIE_CONSENT_KEY = "nowr_cookie_consent";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-2xl mx-auto bg-card border border-border/60 rounded-xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">{t("cookiePreferences")}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("cookieDescription")}{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  {t("privacyPolicy")}
                </Link>{" "}
                {t("forMoreInfo")}
              </p>
            </div>
            <button
              onClick={handleDecline}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleAccept}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              {t("acceptAll")}
            </Button>
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              {t("essentialOnly")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;