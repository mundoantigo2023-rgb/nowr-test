import { useState, useEffect, useMemo } from "react";

export type SupportedLanguage = "es" | "pt" | "en" | "fr" | "de";

const LANGUAGE_STORAGE_KEY = "nowr-user-language";

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  es: "Español",
  pt: "Português",
  en: "English",
  fr: "Français",
  de: "Deutsch",
};

export function detectBrowserLanguage(): SupportedLanguage {
  // Check localStorage first for user preference
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && isValidLanguage(stored)) {
    return stored as SupportedLanguage;
  }

  // Detect from browser
  const browserLang = navigator.language || (navigator as any).userLanguage || "es";
  const primaryLang = browserLang.split("-")[0].toLowerCase();

  // Map common language codes to supported languages
  const languageMap: Record<string, SupportedLanguage> = {
    es: "es",
    pt: "pt",
    en: "en",
    fr: "fr",
    de: "de",
    // Regional variants
    ca: "es", // Catalan -> Spanish
    gl: "es", // Galician -> Spanish
    eu: "es", // Basque -> Spanish
    it: "es", // Italian -> Spanish (closest)
  };

  return languageMap[primaryLang] || "es"; // Default to Spanish
}

function isValidLanguage(lang: string): lang is SupportedLanguage {
  return ["es", "pt", "en", "fr", "de"].includes(lang);
}

export function useUserLanguage() {
  const [language, setLanguage] = useState<SupportedLanguage>(() => detectBrowserLanguage());

  useEffect(() => {
    // Persist language preference
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const languageName = useMemo(() => LANGUAGE_NAMES[language], [language]);

  const changeLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
  };

  return {
    language,
    languageName,
    changeLanguage,
    supportedLanguages: Object.entries(LANGUAGE_NAMES) as [SupportedLanguage, string][],
  };
}

// Static UI translations for app interface
export const UI_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    // Common
    loading: "Cargando...",
    error: "Error",
    save: "Guardar",
    cancel: "Cancelar",
    back: "Volver",
    next: "Siguiente",
    done: "Hecho",
    
    // Navigation
    explore: "Explorar",
    matches: "Matches",
    messages: "Mensajes",
    profile: "Perfil",
    
    // Chat
    typeMessage: "Escribe un mensaje...",
    translate: "Traducir",
    translated: "Traducido",
    
    // Profile
    online: "En línea",
    offline: "Desconectado",
    distance: "a {distance} km",
  },
  pt: {
    loading: "Carregando...",
    error: "Erro",
    save: "Salvar",
    cancel: "Cancelar",
    back: "Voltar",
    next: "Próximo",
    done: "Concluído",
    
    explore: "Explorar",
    matches: "Matches",
    messages: "Mensagens",
    profile: "Perfil",
    
    typeMessage: "Digite uma mensagem...",
    translate: "Traduzir",
    translated: "Traduzido",
    
    online: "Online",
    offline: "Offline",
    distance: "a {distance} km",
  },
  en: {
    loading: "Loading...",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    next: "Next",
    done: "Done",
    
    explore: "Explore",
    matches: "Matches",
    messages: "Messages",
    profile: "Profile",
    
    typeMessage: "Type a message...",
    translate: "Translate",
    translated: "Translated",
    
    online: "Online",
    offline: "Offline",
    distance: "{distance} km away",
  },
  fr: {
    loading: "Chargement...",
    error: "Erreur",
    save: "Enregistrer",
    cancel: "Annuler",
    back: "Retour",
    next: "Suivant",
    done: "Terminé",
    
    explore: "Explorer",
    matches: "Matches",
    messages: "Messages",
    profile: "Profil",
    
    typeMessage: "Écrivez un message...",
    translate: "Traduire",
    translated: "Traduit",
    
    online: "En ligne",
    offline: "Hors ligne",
    distance: "à {distance} km",
  },
  de: {
    loading: "Laden...",
    error: "Fehler",
    save: "Speichern",
    cancel: "Abbrechen",
    back: "Zurück",
    next: "Weiter",
    done: "Fertig",
    
    explore: "Entdecken",
    matches: "Matches",
    messages: "Nachrichten",
    profile: "Profil",
    
    typeMessage: "Nachricht schreiben...",
    translate: "Übersetzen",
    translated: "Übersetzt",
    
    online: "Online",
    offline: "Offline",
    distance: "{distance} km entfernt",
  },
};

export function useTranslation() {
  const { language } = useUserLanguage();
  
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = UI_TRANSLATIONS[language]?.[key] || UI_TRANSLATIONS.es[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    
    return text;
  };

  return { t, language };
}
