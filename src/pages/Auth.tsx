import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { NowrLogo } from "@/components/NowrLogo";
import { useLanguage } from "@/contexts/LanguageContext";

const Auth = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const navigate = useNavigate();
  const { toast } = useToast();

  const signupSchema = z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(8, t("passwordMinLength")),
    confirmPassword: z.string(),
    displayName: z.string().min(2, t("nameMinLength")),
    age: z.number().min(18, t("mustBe18")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("passwordsNoMatch"),
    path: ["confirmPassword"],
  });

  const loginSchema = z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(1, t("password")),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const onboardingComplete = localStorage.getItem("nowr_onboarding_complete");
        if (onboardingComplete) {
          navigate("/home", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }
    });

    // Then listen for auth state changes (login/signup events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect on actual sign-in events, not on initial session check
      if (event === "SIGNED_IN" && session?.user) {
        const onboardingComplete = localStorage.getItem("nowr_onboarding_complete");
        if (onboardingComplete) {
          navigate("/home", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        toast({
          title: t("error"),
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({
          title: t("error"),
          description: error.message === "Invalid login credentials" 
            ? t("invalidCredentials") 
            : error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!ageConfirmed) {
        toast({
          title: t("error"),
          description: t("confirmAge18Error"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!termsAccepted) {
        toast({
          title: t("error"),
          description: t("acceptTermsError"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const ageNum = parseInt(age);
      const validation = signupSchema.safeParse({
        email,
        password,
        confirmPassword,
        displayName,
        age: ageNum,
      });

      if (!validation.success) {
        toast({
          title: t("error"),
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: {
            display_name: displayName,
            age: ageNum,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: t("error"),
            description: t("emailAlreadyRegistered"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("error"),
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("accountCreated"),
          description: t("welcomePrepare"),
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: t("somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showTerms) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Button
          variant="ghost"
          onClick={() => setShowTerms(false)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-display font-bold mb-6 text-foreground">{t("termsConditions")}</h1>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <h2 className="text-lg font-semibold text-foreground">1. Aceptación de términos</h2>
            <p>Al acceder y utilizar NOWR, aceptas cumplir con estos términos y condiciones. Esta plataforma está diseñada exclusivamente para adultos mayores de 18 años.</p>
            
            <h2 className="text-lg font-semibold text-foreground">2. Uso de la plataforma</h2>
            <p>NOWR es una plataforma de conexión entre adultos. Los usuarios son responsables de su comportamiento y de las interacciones que realicen. Cualquier actividad fuera de la plataforma es responsabilidad exclusiva de los usuarios involucrados.</p>
            
            <h2 className="text-lg font-semibold text-foreground">3. Privacidad y datos</h2>
            <p>Respetamos tu privacidad. Los datos personales se utilizan únicamente para el funcionamiento de la plataforma. No compartimos información personal con terceros sin consentimiento.</p>
            
            <h2 className="text-lg font-semibold text-foreground">4. Comportamiento prohibido</h2>
            <p>Está prohibido: compartir contenido ilegal, acosar a otros usuarios, crear perfiles falsos, o cualquier actividad que viole las leyes aplicables.</p>
            
            <h2 className="text-lg font-semibold text-foreground">5. Responsabilidad</h2>
            <p>NOWR no se hace responsable de las interacciones entre usuarios fuera de la plataforma. Los usuarios asumen toda responsabilidad por sus acciones y encuentros.</p>
            
            <h2 className="text-lg font-semibold text-foreground">6. Consentimiento</h2>
            <p>Cualquier interacción entre usuarios debe basarse en el consentimiento mutuo. El respeto es fundamental en nuestra comunidad.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Logo */}
        <div className="mb-8">
          <NowrLogo size="md" animated />
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-center mb-2 text-foreground">
            {mode === "login" ? t("login") : t("createAccount")}
          </h2>
          {mode === "login" && (
            <p className="text-sm text-muted-foreground text-center mb-6">
              {t("welcomeBack")}
            </p>
          )}
          {mode === "signup" && (
            <p className="text-sm text-muted-foreground text-center mb-6">
              {t("oneStepCloser")}
            </p>
          )}

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t("yourNameLabel")}</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder={t("yourNamePlaceholder")}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">{t("yourAgeLabel")}</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder={t("yourAgePlaceholder")}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={18}
                    required
                    className="h-11"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="ageConfirm"
                    checked={ageConfirmed}
                    onCheckedChange={(checked) => setAgeConfirmed(checked as boolean)}
                  />
                  <Label htmlFor="ageConfirm" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    {t("confirmAge18")}
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    {t("acceptTerms")}{" "}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-primary hover:underline"
                    >
                      {t("termsAndConditions")}
                    </button>{" "}
                    {t("andPrivacyPolicy")}
                  </Label>
                </div>

                {/* Legal disclaimer */}
                <p className="text-xs text-muted-foreground/70 text-center pt-2">
                  {t("legalDisclaimer")}
                </p>
              </>
            )}

            <Button
              type="submit"
              className="w-full h-12 gradient-primary text-primary-foreground font-medium mt-6"
              disabled={loading}
            >
              {loading ? t("loading") : mode === "login" ? t("login") : t("createAccount")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? (
              <>
                {t("dontHaveAccount")}{" "}
                <Link to="/auth?mode=signup" className="text-primary hover:underline">
                  {t("createAccount")}
                </Link>
              </>
            ) : (
              <>
                {t("alreadyHaveAccount")}{" "}
                <Link to="/auth?mode=login" className="text-primary hover:underline">
                  {t("login")}
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
