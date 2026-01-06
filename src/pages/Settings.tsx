import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut, User as UserIcon, Shield, Crown, Trash2, Users, Loader2, Sparkles, EyeOff, Cookie, Bot, Globe, Clock, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NowrLogoLoader } from "@/components/NowrLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { SupportedLanguage } from "@/lib/translations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COOKIE_CONSENT_KEY = "nowr_cookie_consent";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isPrime, setIsPrime] = useState(false);
  const [allowHighlight, setAllowHighlight] = useState(true);
  const [invisibleMode, setInvisibleMode] = useState(false);
  const [hideActivityStatus, setHideActivityStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [updatingHighlight, setUpdatingHighlight] = useState(false);
  const [updatingInvisible, setUpdatingInvisible] = useState(false);
  const [updatingActivityStatus, setUpdatingActivityStatus] = useState(false);
  const [cookiePreference, setCookiePreference] = useState<string>("accepted");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
    const storedCookiePreference = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedCookiePreference) {
      setCookiePreference(storedCookiePreference);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("is_prime, allow_highlight, invisible_mode, hide_activity_status")
        .eq("user_id", user?.id)
        .single();

      setIsPrime(data?.is_prime || false);
      setAllowHighlight(data?.allow_highlight !== false);
      setInvisibleMode(data?.invisible_mode || false);
      setHideActivityStatus(data?.hide_activity_status || false);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHighlight = async (enabled: boolean) => {
    if (!user) return;

    setUpdatingHighlight(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ allow_highlight: enabled })
        .eq("user_id", user.id);

      if (error) throw error;

      setAllowHighlight(enabled);
      toast({
        title: enabled ? t("allowHighlight") : t("allowHighlight"),
        description: enabled
          ? t("allowHighlight")
          : t("allowHighlight"),
      });
    } catch (error) {
      console.error("Error updating highlight setting:", error);
      toast({
        title: t("error"),
        description: t("somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setUpdatingHighlight(false);
    }
  };

  const handleToggleInvisible = async (enabled: boolean) => {
    if (!user) return;

    setUpdatingInvisible(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ invisible_mode: enabled })
        .eq("user_id", user.id);

      if (error) throw error;

      setInvisibleMode(enabled);
      toast({
        title: t("invisibleMode"),
        description: t("invisibleMode"),
      });
    } catch (error) {
      console.error("Error updating invisible mode:", error);
      toast({
        title: t("error"),
        description: t("somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setUpdatingInvisible(false);
    }
  };

  const handleToggleActivityStatus = async (enabled: boolean) => {
    if (!user) return;

    setUpdatingActivityStatus(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ hide_activity_status: enabled })
        .eq("user_id", user.id);

      if (error) throw error;

      setHideActivityStatus(enabled);
      toast({
        title: "Estado de actividad",
        description: enabled
          ? "Tu estado de actividad ahora está oculto"
          : "Tu estado de actividad ahora es visible",
      });
    } catch (error) {
      console.error("Error updating activity status:", error);
      toast({
        title: t("error"),
        description: t("somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setUpdatingActivityStatus(false);
    }
  };

  const handleCookiePreferenceChange = (value: string) => {
    setCookiePreference(value);
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    toast({
      title: t("cookiePreferences"),
      description: value === "accepted"
        ? t("acceptAll")
        : t("essentialOnly"),
    });
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as SupportedLanguage);
    toast({
      title: t("language"),
      description: supportedLanguages.find(([code]) => code === value)?.[1] || value,
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast({
        title: t("error"),
        description: t("somethingWentWrong"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    toast({
      title: t("deleteAccount"),
      description: t("done"),
    });
  };

  const handleSeedTestUsers = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-test-users');

      if (error) throw error;

      toast({
        title: t("done"),
        description: data.message || `Created ${data.created?.length || 0} test users.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("error");
      console.error('Seed error:', error);
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold text-foreground">{t("settings")}</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6 max-w-2xl">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("language")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {t("accountSettings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("email")}</p>
              <p className="font-medium text-foreground">{user?.email}</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("prime")}</p>
                <div className="flex items-center gap-2">
                  {isPrime ? (
                    <>
                      <Crown className="h-4 w-4 text-prime animate-prime-shimmer" />
                      <span className="font-medium text-prime">{t("prime")}</span>
                    </>
                  ) : (
                    <span className="font-medium text-foreground">Free</span>
                  )}
                </div>
              </div>
              {!isPrime && (
                <Button
                  variant="outline"
                  className="border-prime text-prime hover:bg-prime/10"
                  onClick={() => navigate("/prime")}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {t("goPrime")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visibility Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {t("privacy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-highlight" className="text-base">{t("allowHighlight")}</Label>
              </div>
              <Switch
                id="allow-highlight"
                checked={allowHighlight}
                onCheckedChange={handleToggleHighlight}
                disabled={updatingHighlight}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="invisible-mode" className="text-base flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  {t("invisibleMode")}
                  {!isPrime && (
                    <span className="inline-flex items-center gap-1 text-xs text-prime">
                      <Crown className="h-3 w-3" />
                      Prime
                    </span>
                  )}
                </Label>
                {!isPrime && (
                  <p className="text-xs text-muted-foreground">
                    Navega sin que otros vean tu estado online ni registrar visitas
                  </p>
                )}
              </div>
              {isPrime ? (
                <Switch
                  id="invisible-mode"
                  checked={invisibleMode}
                  onCheckedChange={handleToggleInvisible}
                  disabled={updatingInvisible}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-prime text-prime hover:bg-prime/10"
                  onClick={() => navigate("/prime")}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  {t("goPrime")}
                </Button>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hide-activity" className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Ocultar estado de actividad
                </Label>
                <p className="text-xs text-muted-foreground">
                  Otros usuarios no verán cuándo estuviste activo
                </p>
              </div>
              <Switch
                id="hide-activity"
                checked={hideActivityStatus}
                onCheckedChange={handleToggleActivityStatus}
                disabled={updatingActivityStatus}
              />
            </div>
          </CardContent>
        </Card>

        {/* Install App */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t("installApp")}
            </CardTitle>
            <CardDescription>
              {t("installAppDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/install")}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("installNow")}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("privacy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/privacy")}>
              {t("privacyPolicy")}
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/terms")}>
              {t("termsConditions")}
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/community-guidelines")}>
              {t("communityGuidelines")}
            </Button>
          </CardContent>
        </Card>

        {/* Cookie Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              {t("cookiePreferences")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={cookiePreference}
              onValueChange={handleCookiePreferenceChange}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="accepted" id="cookies-all" className="mt-1" />
                <div className="space-y-0.5">
                  <Label htmlFor="cookies-all" className="text-base cursor-pointer">
                    {t("acceptAll")}
                  </Label>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="declined" id="cookies-essential" className="mt-1" />
                <div className="space-y-0.5">
                  <Label htmlFor="cookies-essential" className="text-base cursor-pointer">
                    {t("essentialOnly")}
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>



        {/* Actions */}
        <Card>
          <CardContent className="pt-6 space-y-3">


            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("deleteAccount")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteAccount")}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("somethingWentWrong")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;