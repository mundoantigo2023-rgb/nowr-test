import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Store the prompt globally so it persists across component remounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstallable, setIsInstallable] = useState(!!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isIOSStandalone);

    // Check device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // If we already have a stored prompt, use it
    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      setIsInstallable(true);
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, Samsung Browser, etc.)
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      console.log("PWA: beforeinstallprompt event fired");
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("PWA: App was installed");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    console.log("PWA: Install attempt - deferredPrompt:", !!deferredPrompt, "globalPrompt:", !!globalDeferredPrompt);
    
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    
    if (!promptToUse) {
      console.log("PWA: No install prompt available");
      return false;
    }

    try {
      console.log("PWA: Showing install prompt");
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      console.log("PWA: User choice:", outcome);
      
      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      return outcome === "accepted";
    } catch (error) {
      console.error("PWA: Error installing:", error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    installApp,
    // For debugging
    hasPrompt: !!(deferredPrompt || globalDeferredPrompt)
  };
};