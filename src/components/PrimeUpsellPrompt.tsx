import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Clock, Camera, Eye, Zap, X, Sparkles, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type UpsellContext = 
  | "chat_timer_ending"
  | "nowpik_blocked"
  | "profile_limit"
  | "boost_used"
  | "filter_locked"
  | "visitors_locked"
  | "general";

interface PrimeUpsellPromptProps {
  context: UpsellContext;
  onDismiss?: () => void;
  className?: string;
  variant?: "inline" | "overlay" | "card" | "minimal";
}

const contextConfig: Record<UpsellContext, {
  icon: typeof Crown;
  title: string;
  description: string;
  cta: string;
}> = {
  chat_timer_ending: {
    icon: Clock,
    title: "El tiempo se está agotando…",
    description: "Extiende esta conexión con Prime.",
    cta: "Extender ahora",
  },
  nowpik_blocked: {
    icon: Camera,
    title: "Este momento merece privacidad.",
    description: "Las fotos temporales son Prime.",
    cta: "Desbloquear NowPik",
  },
  profile_limit: {
    icon: Eye,
    title: "Este perfil está más cerca de lo que crees.",
    description: "Desbloquéalo con Prime.",
    cta: "Ver más perfiles",
  },
  boost_used: {
    icon: Zap,
    title: "Tu perfil está subiendo ahora.",
    description: "Con Prime, sube cuando quieras.",
    cta: "Boost ilimitado",
  },
  filter_locked: {
    icon: Lock,
    title: "Filtros avanzados",
    description: "Encuentra exactamente lo que buscas con Prime.",
    cta: "Desbloquear filtros",
  },
  visitors_locked: {
    icon: Users,
    title: "¿Quién visita tu perfil?",
    description: "Descubre quién te ha visto con Prime.",
    cta: "Ver visitantes",
  },
  general: {
    icon: Sparkles,
    title: "Los usuarios Prime reciben el doble de respuestas.",
    description: "No es magia. Es visibilidad.",
    cta: "Activar Prime",
  },
};

const PrimeUpsellPrompt = ({ 
  context, 
  onDismiss, 
  className,
  variant = "card" 
}: PrimeUpsellPromptProps) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const config = contextConfig[context];
  const Icon = config.icon;

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    navigate("/prime");
  };

  // Minimal variant - just icon and text with link
  if (variant === "minimal") {
    return (
      <button
        onClick={handleUpgrade}
        className={cn(
          "flex items-center gap-2 text-prime hover:text-prime-glow transition-colors text-sm",
          className
        )}
      >
        <Crown className="h-3.5 w-3.5" />
        <span className="underline underline-offset-2">{config.cta}</span>
      </button>
    );
  }

  // Inline variant - compact horizontal
  if (variant === "inline") {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-prime/15 via-prime/10 to-transparent rounded-xl border border-prime/30",
        className
      )}>
        <div className="p-2 rounded-full bg-prime/20">
          <Icon className="h-4 w-4 text-prime" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{config.title}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="shrink-0 bg-prime hover:bg-prime-glow text-prime-foreground text-xs px-3"
        >
          <Crown className="h-3 w-3 mr-1.5" />
          Prime
        </Button>
        {onDismiss && (
          <button 
            onClick={handleDismiss}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Overlay variant - full screen overlay
  if (variant === "overlay") {
    return (
      <div className={cn(
        "absolute inset-0 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40",
        className
      )}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-prime/30 to-prime/10 flex items-center justify-center mb-6 glow-prime">
          <Icon className="h-10 w-10 text-prime" />
        </div>
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">
          {config.title}
        </h3>
        <p className="text-muted-foreground mb-8 max-w-xs text-lg">
          {config.description}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            onClick={handleUpgrade}
            className="w-full h-12 bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground font-semibold shadow-lg shadow-prime/30"
          >
            <Crown className="h-4 w-4 mr-2" />
            {config.cta}
          </Button>
          {onDismiss && (
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              Ahora no
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-6">
          Cancela cuando quieras. Sin compromisos.
        </p>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-prime/30 bg-gradient-to-br from-prime/10 via-prime/5 to-background p-4",
      className
    )}>
      {onDismiss && (
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-full bg-prime/20 shrink-0">
          <Icon className="h-5 w-5 text-prime" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="font-semibold text-foreground">{config.title}</p>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground font-medium shadow-md shadow-prime/20"
          >
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            {config.cta}
          </Button>
        </div>
      </div>
      {/* Subtle Prime text */}
      <p className="text-xs text-muted-foreground/60 text-center mt-3 italic">
        Cancela cuando quieras. Sin compromisos.
      </p>
    </div>
  );
};

export default PrimeUpsellPrompt;
