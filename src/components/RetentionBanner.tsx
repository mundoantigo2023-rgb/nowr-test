import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRetentionNotifications } from "@/hooks/useRetentionNotifications";

interface RetentionBannerProps {
  userId: string | null;
}

const RetentionBanner = ({ userId }: RetentionBannerProps) => {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useRetentionNotifications(userId);
  const [currentNotification, setCurrentNotification] = useState<typeof notifications[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Show the most recent unread notification
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      // Small delay before showing for better UX
      const timer = setTimeout(() => {
        setCurrentNotification(notifications[0]);
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [notifications, currentNotification]);

  const handleDismiss = async () => {
    if (!currentNotification) return;
    
    setIsAnimatingOut(true);
    
    // Wait for animation to complete
    setTimeout(async () => {
      await markAsRead(currentNotification.id);
      setCurrentNotification(null);
      setIsVisible(false);
      setIsAnimatingOut(false);
      
      // Show next notification if available
      if (notifications.length > 1) {
        setTimeout(() => {
          setCurrentNotification(notifications[1]);
          setIsVisible(true);
        }, 500);
      }
    }, 300);
  };

  const handleCTA = async () => {
    if (!currentNotification) return;
    
    await markAsRead(currentNotification.id);
    setCurrentNotification(null);
    setIsVisible(false);
    navigate(currentNotification.cta_path);
  };

  if (!isVisible || !currentNotification) return null;

  const isPrimePromo = currentNotification.cta_path === "/prime";

  return (
    <div 
      className={cn(
        "fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto transition-all duration-300",
        isAnimatingOut ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0 animate-fade-in"
      )}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-md",
        isPrimePromo 
          ? "bg-gradient-to-br from-prime/20 via-background/95 to-prime/10 border-prime/40" 
          : "bg-card/95 border-border"
      )}>
        {/* Background decoration */}
        {isPrimePromo && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-prime/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* Icon */}
          <div className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            isPrimePromo 
              ? "bg-prime/20" 
              : "bg-primary/20"
          )}>
            {isPrimePromo ? (
              <Crown className="h-5 w-5 text-prime" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className={cn(
                "font-semibold text-sm leading-tight",
                isPrimePromo ? "text-foreground" : "text-foreground"
              )}>
                {currentNotification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentNotification.message}
              </p>
            </div>

            {/* CTA Button */}
            <Button
              size="sm"
              onClick={handleCTA}
              className={cn(
                "h-9 text-sm font-medium",
                isPrimePromo 
                  ? "bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground shadow-lg shadow-prime/20" 
                  : "gradient-primary"
              )}
            >
              {isPrimePromo && <Crown className="h-3.5 w-3.5 mr-1.5" />}
              {currentNotification.cta_text}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Notification type indicator */}
        <div className="absolute bottom-2 right-3">
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded",
            isPrimePromo ? "text-prime/60" : "text-muted-foreground/50"
          )}>
            {currentNotification.notification_type.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RetentionBanner;
