import { useNavigate } from "react-router-dom";
import { Download, Smartphone, Share, Plus, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";
import NowrBrandLogo from "@/components/NowrBrandLogo";

const Install = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const { t } = useLanguage();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Logo */}
        <div className="mb-8">
          <NowrBrandLogo size="lg" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          {t("installApp")}
        </h1>
        <p className="text-muted-foreground text-center mb-8 max-w-sm">
          {t("installAppDescription")}
        </p>

        {/* Status */}
        {isInstalled ? (
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <p className="text-primary font-medium">{t("appInstalled")}</p>
            <Button onClick={() => navigate("/home")} className="mt-4">
              {t("continue")}
            </Button>
          </div>
        ) : isInstallable ? (
          /* Chrome/Android install button */
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              <Download className="h-5 w-5" />
              {t("installNow")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("installFree")}
            </p>
          </div>
        ) : isIOS ? (
          /* iOS instructions */
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-4 w-full">
              <h2 className="text-lg font-semibold text-center text-foreground">
                {t("iosInstallTitle")}
              </h2>
              
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Share className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{t("iosStep1Title")}</p>
                    <p className="text-sm text-muted-foreground">{t("iosStep1Desc")}</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{t("iosStep2Title")}</p>
                    <p className="text-sm text-muted-foreground">{t("iosStep2Desc")}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          /* Desktop or unsupported */
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {t("installFromMobile")}
            </p>
            <Button variant="outline" onClick={() => navigate("/home")}>
              {t("continue")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Install;