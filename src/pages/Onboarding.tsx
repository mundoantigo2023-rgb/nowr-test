import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NowrLogo } from "@/components/NowrLogo";
import { Crown, Flame, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import SearchPreferenceStep, { SearchPreference } from "@/components/SearchPreferenceStep";
import VisibleGenderStep, { VisibleGender } from "@/components/VisibleGenderStep";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const { track, trackFunnelStep } = useAnalytics();
  const [searchPreference, setSearchPreference] = useState<SearchPreference | null>(null);
  const [visibleGender, setVisibleGender] = useState<VisibleGender | null>(null);
  const [saving, setSaving] = useState(false);

  // Steps: 0-3 = intro slides, 4 = visible gender, 5 = search preference
  const introSteps = [
    {
      icon: <Flame className="w-16 h-16" />,
      title: "El deseo no espera.",
      subtitle: "NOWR conecta personas que saben lo que quieren, aquí y ahora.",
      gradient: "from-primary/30 via-primary/20 to-transparent",
    },
    {
      icon: <Clock className="w-16 h-16" />,
      title: "Menos tiempo. Más intención.",
      subtitle: "Las conexiones en NOWR tienen ritmo. Cuando hay match, el momento importa.",
      gradient: "from-accent/30 via-accent/20 to-transparent",
    },
    {
      icon: <Shield className="w-16 h-16" />,
      title: "Tú decides el ritmo.",
      subtitle: "Controla visibilidad, tiempo y privacidad. Nada es permanente si no quieres.",
      gradient: "from-primary/20 via-accent/15 to-transparent",
    },
    {
      icon: <Crown className="w-16 h-16" />,
      title: "Algunas conexiones merecen más.",
      subtitle: "NOWR Prime te da prioridad, control y libertad.",
      extraText: "Actívalo cuando lo sientas.",
      gradient: "from-prime/30 via-prime/20 to-transparent",
      isPrime: true,
    },
  ];

  const totalSteps = introSteps.length + 2; // +2 for gender and preference steps

  // Track onboarding start
  useEffect(() => {
    track("onboarding_started");
  }, []);

  // Track each step view
  useEffect(() => {
    if (currentStep < introSteps.length) {
      trackFunnelStep("onboarding", currentStep + 1, introSteps[currentStep].title);
    } else if (currentStep === introSteps.length) {
      trackFunnelStep("onboarding", currentStep + 1, "visible_gender_selection");
    } else {
      trackFunnelStep("onboarding", currentStep + 1, "search_preference_selection");
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleVisibleGenderSelect = (gender: VisibleGender) => {
    setVisibleGender(gender);
    setCurrentStep((prev) => prev + 1);
  };

  const handleSearchPreferenceSelect = async (preference: SearchPreference) => {
    setSearchPreference(preference);
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Sesión no válida. Inicia sesión de nuevo.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Save preferences to profile
      const { error } = await supabase
        .from("profiles")
        .update({
          search_preference: preference,
          visible_gender: visibleGender,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      track("onboarding_completed", { 
        totalSteps, 
        searchPreference: preference,
        visibleGender,
      });
      localStorage.setItem("nowr_onboarding_complete", "true");
      navigate("/home");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar tus preferencias.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Can't skip preference steps
    if (currentStep >= introSteps.length) {
      toast({
        title: "Paso obligatorio",
        description: "Define lo que buscas para continuar.",
      });
      return;
    }
    
    track("onboarding_skipped", { skippedAtStep: currentStep + 1 });
    setCurrentStep(introSteps.length); // Jump to gender selection
  };

  const isIntroStep = currentStep < introSteps.length;
  const isGenderStep = currentStep === introSteps.length;
  const isPreferenceStep = currentStep === introSteps.length + 1;

  // Render preference selection steps
  if (isGenderStep) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-primary/10 to-transparent opacity-60" />
        </div>

        <header className="relative z-10 flex items-center justify-between p-6">
          <NowrLogo size="sm" animated />
          <div className="w-20" />
        </header>

        <div className="relative z-10 flex justify-center gap-2 px-6 mb-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                index === currentStep
                  ? "w-10 bg-primary"
                  : index < currentStep
                  ? "w-6 bg-primary/60"
                  : "w-4 bg-muted/50"
              )}
            />
          ))}
        </div>

        <main className="relative z-10 flex-1">
          <VisibleGenderStep onSelect={handleVisibleGenderSelect} initialValue={visibleGender} />
        </main>

        <p className="relative z-10 text-xs text-muted-foreground/50 text-center pb-6">
          {currentStep + 1} de {totalSteps}
        </p>
      </div>
    );
  }

  if (isPreferenceStep) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-primary/10 to-transparent opacity-60" />
        </div>

        <header className="relative z-10 flex items-center justify-between p-6">
          <NowrLogo size="sm" animated />
          <div className="w-20" />
        </header>

        <div className="relative z-10 flex justify-center gap-2 px-6 mb-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                index === currentStep
                  ? "w-10 bg-primary"
                  : index < currentStep
                  ? "w-6 bg-primary/60"
                  : "w-4 bg-muted/50"
              )}
            />
          ))}
        </div>

        <main className="relative z-10 flex-1">
          <SearchPreferenceStep onSelect={handleSearchPreferenceSelect} initialValue={searchPreference} />
        </main>

        <p className="relative z-10 text-xs text-muted-foreground/50 text-center pb-6">
          {currentStep + 1} de {totalSteps}
        </p>
      </div>
    );
  }

  // Intro steps
  const step = introSteps[currentStep];
  const isLastIntroStep = currentStep === introSteps.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-radial opacity-60 transition-all duration-700",
            step.gradient
          )} 
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <NowrLogo size="sm" animated />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Saltar
        </Button>
      </header>

      {/* Progress indicators */}
      <div className="relative z-10 flex justify-center gap-2 px-6 mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              index === currentStep
                ? "w-10 bg-primary"
                : index < currentStep
                ? "w-6 bg-primary/60"
                : "w-4 bg-muted/50"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-40">
        <div
          key={currentStep}
          className="flex flex-col items-center text-center max-w-sm animate-fade-in"
        >
          {/* Icon */}
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center mb-10 transition-all duration-500",
            step.isPrime 
              ? "bg-gradient-to-br from-prime/30 via-prime/20 to-prime/10 text-prime glow-prime" 
              : "bg-primary/15 text-primary"
          )}>
            {step.icon}
          </div>

          {/* Title */}
          <h1 className={cn(
            "font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight leading-tight",
            step.isPrime ? "text-gradient-prime" : "text-foreground"
          )}>
            {step.title}
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xs">
            {step.subtitle}
          </p>

          {/* Extra text for Prime step */}
          {step.extraText && (
            <p className="text-prime font-medium mt-4 animate-pulse">
              {step.extraText}
            </p>
          )}
        </div>
      </main>

      {/* Footer with actions */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-background via-background to-transparent pt-24">
        <div className="max-w-sm mx-auto space-y-4">
          <Button
            onClick={handleNext}
            className={cn(
              "w-full h-14 text-base font-semibold transition-all",
              step.isPrime 
                ? "bg-gradient-to-r from-prime to-prime-deep hover:from-prime-glow hover:to-prime text-prime-foreground shadow-lg shadow-prime/30" 
                : "gradient-primary glow"
            )}
          >
            {isLastIntroStep ? (
              <>
                <Crown className="h-5 w-5 mr-2" />
                Continuar
              </>
            ) : (
              "Continuar"
            )}
          </Button>

          {/* Step indicator text */}
          <p className="text-xs text-muted-foreground/50 text-center">
            {currentStep + 1} de {totalSteps}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
