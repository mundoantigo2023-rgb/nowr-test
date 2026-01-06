import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Crown, Check, X, Eye, MessageCircle, Image, Zap, 
  Loader2, EyeOff, Lock, Clock, Languages, Shield, Sparkles,
  Users, Timer, Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NowrLogoLoader } from "@/components/NowrLogo";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

type PricingPlan = "trial" | "monthly" | "quarterly" | "annual";

const Prime = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPrime, setIsPrime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>("monthly");
  const { track } = useAnalytics();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/");
        return;
      }

      setUserId(session.user.id);
      track("prime_page_viewed", { userId: session.user.id });

      const { data } = await supabase
        .from("profiles")
        .select("is_prime")
        .eq("user_id", session.user.id)
        .single();

      setIsPrime(data?.is_prime || false);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSubscribe = async (plan: PricingPlan = selectedPlan) => {
    if (!userId) return;
    
    setActivating(true);
    track("prime_upgrade_started", { source: "prime_page", plan });
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_prime: true })
        .eq("user_id", userId);

      if (error) throw error;

      setIsPrime(true);
      toast({
        title: "¡Prime activado!",
        description: plan === "trial" 
          ? "Tienes 48 horas de acceso Prime completo."
          : "Ahora tienes acceso a todas las funciones premium.",
      });
    } catch (error) {
      console.error("Error activating Prime:", error);
      toast({
        title: "Error",
        description: "No se pudo activar Prime. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }

  const pricingPlans = {
    trial: { price: "1.99", period: "48h", label: "Prueba", perMonth: null, savings: null },
    monthly: { price: "9.99", period: "/mes", label: "Mensual", perMonth: "9.99", savings: null },
    quarterly: { price: "24.99", period: "/3 meses", label: "Trimestral", perMonth: "8.33", savings: "17%" },
    annual: { price: "79.99", period: "/año", label: "Anual", perMonth: "6.66", savings: "33%" },
  };

  const benefits = [
    { icon: Users, text: "Aparece primero en el grid" },
    { icon: Eye, text: "Acceso total a For You" },
    { icon: Timer, text: "Chats extendidos y reactivables" },
    { icon: Camera, text: "Fotos y álbumes temporales" },
    { icon: EyeOff, text: "Modo incógnito" },
    { icon: Sparkles, text: "Sin anuncios" },
  ];

  const comparisonFeatures = [
    {
      icon: Eye,
      title: "Grid de perfiles",
      free: "Limitado",
      prime: "Ilimitado",
    },
    {
      icon: Zap,
      title: "Boosts",
      free: "1x por semana",
      prime: "Prioritarios",
    },
    {
      icon: Clock,
      title: "Duración del chat",
      free: "30 min",
      prime: "60-90 min",
    },
    {
      icon: MessageCircle,
      title: "Reabrir chats",
      free: false,
      prime: true,
    },
    {
      icon: Image,
      title: "Fotos temporales",
      free: false,
      prime: true,
    },
    {
      icon: Lock,
      title: "Bloqueo de capturas",
      free: false,
      prime: true,
    },
    {
      icon: EyeOff,
      title: "Modo incógnito",
      free: false,
      prime: true,
    },
    {
      icon: Shield,
      title: "Confirmación de lectura",
      free: false,
      prime: true,
    },
    {
      icon: Languages,
      title: "Traducción",
      free: "Básica",
      prime: "Completa",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Elegant dark gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-prime/5 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-prime/10 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold flex items-center gap-2 text-foreground">
            <Crown className="h-5 w-5 text-prime drop-shadow-[0_0_8px_hsl(var(--prime)/0.5)] animate-prime-shimmer" />
            NOWR Prime
          </h1>
        </div>
      </header>

      <main className="container py-8 max-w-2xl space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-prime/30 via-prime-muted/20 to-prime/10 mb-2 glow-prime">
            <Crown className="h-14 w-14 text-prime drop-shadow-[0_0_20px_hsl(var(--prime)/0.6)] animate-prime-shimmer" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {isPrime ? "Eres Prime" : "NOWR Prime"}
            </h2>
            <p className="text-xl text-gradient-prime font-medium">
              {isPrime 
                ? "Tu acceso completo está activo." 
                : "El deseo no espera. Tú tampoco."}
            </p>
          </div>
        </div>

        {/* Benefits List - Non Prime */}
        {!isPrime && (
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="grid gap-2">
              {benefits.map((benefit, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-border/30"
                >
                  <div className="p-1.5 rounded-lg bg-prime/20">
                    <benefit.icon className="h-4 w-4 text-prime" />
                  </div>
                  <span className="text-sm text-foreground">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Section (non-Prime) */}
        {!isPrime && (
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            {/* Trial Offer */}
            <Card className="border-prime/40 bg-gradient-to-r from-prime/15 via-prime/10 to-prime/15 overflow-hidden relative">
              <div className="absolute top-0 right-0 px-3 py-1 bg-prime text-prime-foreground text-xs font-bold rounded-bl-lg">
                OFERTA
              </div>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Prime por 48h</p>
                  <p className="text-sm text-muted-foreground">Prueba sin compromiso</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-prime">€1.99</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSubscribe("trial")}
                  disabled={activating}
                  className="bg-prime hover:bg-prime-glow text-prime-foreground font-semibold shadow-lg shadow-prime/30"
                >
                  {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Probar"}
                </Button>
              </CardContent>
            </Card>

            {/* Main Pricing Cards */}
            <div className="grid grid-cols-3 gap-3">
              {(["monthly", "quarterly", "annual"] as PricingPlan[]).map((plan) => {
                const p = pricingPlans[plan];
                const isSelected = selectedPlan === plan;
                const isBest = plan === "annual";
                
                return (
                  <Card
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "cursor-pointer transition-all relative overflow-hidden",
                      isSelected 
                        ? "border-prime ring-2 ring-prime/30 bg-prime/10" 
                        : "border-border/50 hover:border-prime/30",
                      isBest && "ring-1 ring-prime/50"
                    )}
                  >
                    {isBest && (
                      <div className="absolute top-0 left-0 right-0 bg-prime text-prime-foreground text-[10px] font-bold text-center py-0.5">
                        MEJOR VALOR
                      </div>
                    )}
                    <CardContent className={cn("p-3 text-center", isBest && "pt-6")}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{p.label}</p>
                      <div className="flex items-baseline justify-center gap-0.5">
                        <span className="text-xl font-bold text-foreground">€{p.price}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{p.period}</p>
                      {p.perMonth && (
                        <p className="text-xs text-prime font-medium mt-1">
                          €{p.perMonth}/mes
                        </p>
                      )}
                      {p.savings && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-prime/20 text-prime text-[10px] font-bold rounded">
                          -{p.savings}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main CTA */}
            <Button
              onClick={() => handleSubscribe()}
              disabled={activating}
              className="w-full h-14 bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground font-semibold text-lg shadow-lg shadow-prime/30 hover:shadow-xl hover:shadow-prime/40 transition-all"
            >
              {activating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Crown className="h-5 w-5 mr-2" />
              )}
              {activating ? "Activando..." : "Activar Prime"}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              Cancela cuando quieras. Sin compromisos.
            </p>
          </div>
        )}

        {/* Comparison Section */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="text-center">
            <h3 className="text-lg font-display font-semibold text-foreground">
              {isPrime ? "Tu plan incluye" : "Compara planes"}
            </h3>
          </div>

          <div className="space-y-2">
            {/* Header */}
            {!isPrime && (
              <div className="grid grid-cols-3 gap-2 px-4 py-2 text-sm">
                <div className="text-foreground/70">Función</div>
                <div className="text-center text-foreground/50">Free</div>
                <div className="text-center text-prime font-semibold">Prime</div>
              </div>
            )}
            
            {comparisonFeatures.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "grid gap-2 px-4 py-3 rounded-xl transition-all",
                  isPrime 
                    ? "grid-cols-2 bg-prime/5 border border-prime/20" 
                    : "grid-cols-3 bg-secondary/20 border border-border/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <feature.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{feature.title}</span>
                </div>
                
                {!isPrime && (
                  <div className="text-center flex items-center justify-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30" />
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">{feature.free}</span>
                    )}
                  </div>
                )}
                
                <div className="text-center flex items-center justify-center">
                  {typeof feature.prime === 'boolean' ? (
                    feature.prime ? (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-prime/20">
                        <Check className="h-3.5 w-3.5 text-prime" />
                      </div>
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30" />
                    )
                  ) : (
                    <span className="text-xs font-medium text-prime">{feature.prime}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        {!isPrime && (
          <div className="text-center py-4 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <p className="text-sm text-muted-foreground italic">
              Los usuarios Prime reciben más respuestas y más matches.
            </p>
            <p className="text-foreground font-medium mt-1">
              No es suerte. Es visibilidad.
            </p>
          </div>
        )}

        {/* Bottom CTA (non-Prime) */}
        {!isPrime && (
          <div className="animate-fade-in pb-8" style={{ animationDelay: "0.3s" }}>
            <Button
              onClick={() => handleSubscribe()}
              disabled={activating}
              className="w-full h-14 bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground font-semibold text-lg shadow-lg shadow-prime/30 glow-prime"
            >
              {activating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Crown className="h-5 w-5 mr-2" />
              )}
              {activating ? "Activando..." : `Activar Prime · €${pricingPlans[selectedPlan].price}${pricingPlans[selectedPlan].period}`}
            </Button>
          </div>
        )}

        {/* Prime Active State */}
        {isPrime && (
          <Card className="border-prime/30 bg-gradient-to-br from-prime/10 to-prime-muted/5 animate-fade-in glow-prime" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-prime/30 to-prime-deep/20 flex items-center justify-center mx-auto ring-2 ring-prime/30">
                <Crown className="h-8 w-8 text-prime drop-shadow-[0_0_12px_hsl(var(--prime)/0.6)] animate-prime-shimmer" />
              </div>
              <div>
                <p className="font-display font-bold text-xl text-gradient-prime">Tu membresía está activa</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Disfruta de todos los beneficios Prime sin límites
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-prime/30 text-prime hover:bg-prime/10 hover:border-prime/50"
                onClick={() => navigate("/my-profile")}
              >
                Volver a mi perfil
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Prime;
