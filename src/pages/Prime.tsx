import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Crown, Eye, EyeOff, Sparkles,
  Users, Timer, Camera, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NowrLogoLoader } from "@/components/NowrLogo";
import { useAnalytics } from "@/hooks/useAnalytics";

import BottomNav from "@/components/BottomNav";



const Prime = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPrime, setIsPrime] = useState(false);
  const [loading, setLoading] = useState(true);

  const { track } = useAnalytics();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/");
        return;
      }


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



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }



  const benefits = [
    { icon: Users, text: "Aparece primero en el grid" },
    { icon: Eye, text: "Acceso total a For You" },
    { icon: Timer, text: "Chats extendidos y reactivables" },
    { icon: Camera, text: "Fotos y álbumes temporales" },
    { icon: EyeOff, text: "Modo incógnito" },
    { icon: Sparkles, text: "Sin anuncios" },
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

        {/* Prime Coming Soon / Paused State */}
        <Card className="border-prime/30 bg-gradient-to-br from-prime/10 to-transparent">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Próximamente</h3>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                Estamos actualizando las suscripciones Prime para ofrecerte una mejor experiencia.
              </p>
            </div>
            <Button
              variant="outline"
              disabled
              className="mt-4 border-prime/30 text-prime opacity-50"
            >
              Suscripciones Pausadas
            </Button>
          </CardContent>
        </Card>



        {/* Prime Active State */}
        {
          isPrime && (
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
          )
        }
      </main >

      <BottomNav />
    </div >
  );
};

export default Prime;
