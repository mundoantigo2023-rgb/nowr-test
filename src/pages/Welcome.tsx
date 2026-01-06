import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NowrLogo } from "@/components/NowrLogo";
import { useLanguage } from "@/contexts/LanguageContext";

const Welcome = () => {
  const [step, setStep] = useState(1);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const { t, language } = useLanguage();

  // Localized content
  const content = {
    es: {
      tagline: "El encuentro está aquí.",
      subtitle: "Un espacio privado donde la intención es clara y el momento importa.",
      ageVerification: "NOWR es una plataforma exclusiva para mayores de 18 años.",
      ageDescription: "Aquí las conexiones suceden en tiempo real, con respeto y consentimiento.",
      ageConfirm: "Confirmo que tengo más de 18 años",
      continue: "Continuar",
      enter: "Entrar",
      haveAccount: "Ya tengo cuenta",
      adultsOnly: "Exclusivo mayores de 18 años",
      values: "Privacidad · Discreción · Respeto",
      footer: "NOWR no promete historias. Facilita encuentros.",
    },
    pt: {
      tagline: "O encontro está aqui.",
      subtitle: "Um espaço privado onde a intenção é clara e o momento importa.",
      ageVerification: "NOWR é uma plataforma exclusiva para maiores de 18 anos.",
      ageDescription: "Aqui as conexões acontecem em tempo real, com respeito e consentimento.",
      ageConfirm: "Confirmo que tenho mais de 18 anos",
      continue: "Continuar",
      enter: "Entrar",
      haveAccount: "Já tenho conta",
      adultsOnly: "Exclusivo para maiores de 18 anos",
      values: "Privacidade · Discrição · Respeito",
      footer: "NOWR não promete histórias. Facilita encontros.",
    },
    en: {
      tagline: "The encounter is here.",
      subtitle: "A private space where intention is clear and the moment matters.",
      ageVerification: "NOWR is an exclusive platform for adults 18 and over.",
      ageDescription: "Here connections happen in real time, with respect and consent.",
      ageConfirm: "I confirm I am 18 years or older",
      continue: "Continue",
      enter: "Enter",
      haveAccount: "I already have an account",
      adultsOnly: "Adults 18+ only",
      values: "Privacy · Discretion · Respect",
      footer: "NOWR doesn't promise stories. It facilitates encounters.",
    },
    fr: {
      tagline: "La rencontre est ici.",
      subtitle: "Un espace privé où l'intention est claire et le moment compte.",
      ageVerification: "NOWR est une plateforme exclusive pour les plus de 18 ans.",
      ageDescription: "Ici, les connexions se font en temps réel, avec respect et consentement.",
      ageConfirm: "Je confirme avoir plus de 18 ans",
      continue: "Continuer",
      enter: "Entrer",
      haveAccount: "J'ai déjà un compte",
      adultsOnly: "Réservé aux plus de 18 ans",
      values: "Confidentialité · Discrétion · Respect",
      footer: "NOWR ne promet pas d'histoires. Il facilite les rencontres.",
    },
  };

  const c = content[language];

  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-6">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[60px]" />
        </div>

        <main className="relative z-10 flex flex-col items-center text-center max-w-md animate-fade-in">
          {/* Logo */}
          <div className="mb-10">
            <NowrLogo size="lg" animated />
          </div>

          {/* Age verification text */}
          <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
            {c.ageVerification}
            <br />
            {c.ageDescription}
          </p>

          {/* Age confirmation checkbox */}
          <div className="flex items-start space-x-3 mb-8 text-left">
            <Checkbox
              id="ageConfirm"
              checked={ageConfirmed}
              onCheckedChange={(checked) => setAgeConfirmed(checked as boolean)}
              className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="ageConfirm" className="text-sm text-muted-foreground leading-tight cursor-pointer">
              {c.ageConfirm}
            </Label>
          </div>

          {/* CTA */}
          <Button
            asChild={ageConfirmed}
            size="lg"
            className="gradient-primary text-primary-foreground font-medium h-14 glow text-base w-full max-w-xs"
            disabled={!ageConfirmed}
          >
            {ageConfirmed ? (
              <Link to="/auth?mode=signup">{c.continue}</Link>
            ) : (
              <span>{c.continue}</span>
            )}
          </Button>

          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-muted-foreground hover:text-foreground"
            onClick={() => setStep(1)}
          >
            {t("back")}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center gap-12 px-6 text-center">
        {/* Logo */}
        <div className="animate-fade-in flex flex-col items-center">
          <NowrLogo size="xl" animated />
          <div className="h-[2px] w-20 mx-auto mt-8 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        {/* Tagline */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <p className="text-xl md:text-2xl text-foreground font-medium tracking-tight">
            {c.tagline}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {c.subtitle}
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col gap-4 w-full max-w-xs animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground font-medium h-14 glow text-base"
            onClick={() => setStep(2)}
          >
            {c.enter}
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12 text-muted-foreground hover:text-foreground">
            <Link to="/auth?mode=login">{c.haveAccount}</Link>
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {c.adultsOnly}
          </p>
          <p className="text-xs text-muted-foreground/50">
            {c.values}
          </p>
        </div>
      </main>

      {/* Footer tagline */}
      <footer className="absolute bottom-6 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <p className="text-xs text-muted-foreground/40 tracking-wide">
          {c.footer}
        </p>
      </footer>
    </div>
  );
};

export default Welcome;