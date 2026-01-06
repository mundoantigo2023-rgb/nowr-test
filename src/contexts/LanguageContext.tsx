import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { translations, SupportedLanguage, LANGUAGE_NAMES } from "@/lib/translations";

const LANGUAGE_STORAGE_KEY = "nowr-user-language";

interface LanguageContextType {
  language: SupportedLanguage;
  languageName: string;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  supportedLanguages: [SupportedLanguage, string][];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Map timezone to language (helps detect country more accurately)
function getLanguageFromTimezone(): SupportedLanguage | null {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Spanish-speaking countries
    const spanishTimezones = [
      "Europe/Madrid", "Atlantic/Canary", "Africa/Ceuta", // Spain
      "America/Mexico_City", "America/Cancun", "America/Monterrey", "America/Tijuana", // Mexico
      "America/Argentina/Buenos_Aires", "America/Argentina/Cordoba", // Argentina
      "America/Bogota", // Colombia
      "America/Lima", // Peru
      "America/Santiago", // Chile
      "America/Caracas", // Venezuela
      "America/Guayaquil", // Ecuador
      "America/La_Paz", // Bolivia
      "America/Asuncion", // Paraguay
      "America/Montevideo", // Uruguay
      "America/Panama", // Panama
      "America/Costa_Rica", // Costa Rica
      "America/Guatemala", // Guatemala
      "America/Havana", // Cuba
      "America/Santo_Domingo", // Dominican Republic
      "America/Puerto_Rico", // Puerto Rico
      "America/Tegucigalpa", // Honduras
      "America/El_Salvador", // El Salvador
      "America/Managua", // Nicaragua
    ];
    
    // Portuguese-speaking countries
    const portugueseTimezones = [
      "America/Sao_Paulo", "America/Fortaleza", "America/Recife", "America/Bahia", 
      "America/Belem", "America/Manaus", "America/Cuiaba", "America/Porto_Velho",
      "America/Rio_Branco", "America/Campo_Grande", // Brazil
      "Europe/Lisbon", "Atlantic/Azores", "Atlantic/Madeira", // Portugal
      "Africa/Luanda", // Angola
      "Africa/Maputo", // Mozambique
    ];
    
    // French-speaking countries
    const frenchTimezones = [
      "Europe/Paris", // France
      "Europe/Brussels", // Belgium
      "Europe/Zurich", // Switzerland (partial)
      "America/Montreal", "America/Toronto", // Canada (Quebec)
      "Africa/Casablanca", "Africa/Algiers", "Africa/Tunis", // North Africa
      "Africa/Dakar", "Africa/Abidjan", // West Africa
    ];
    
    if (spanishTimezones.some(tz => timezone.includes(tz.split('/')[1]) || timezone === tz)) {
      return "es";
    }
    if (portugueseTimezones.some(tz => timezone.includes(tz.split('/')[1]) || timezone === tz)) {
      return "pt";
    }
    if (frenchTimezones.some(tz => timezone.includes(tz.split('/')[1]) || timezone === tz)) {
      return "fr";
    }
    
    // English for US, UK, Australia, etc.
    const englishTimezones = [
      "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
      "America/Phoenix", "Pacific/Honolulu", // USA
      "Europe/London", // UK
      "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", // Australia
      "Pacific/Auckland", // New Zealand
    ];
    if (englishTimezones.some(tz => timezone.includes(tz.split('/')[1]) || timezone === tz)) {
      return "en";
    }
  } catch (e) {
    console.log("Could not detect timezone");
  }
  return null;
}

function detectBrowserLanguage(): SupportedLanguage {
  // Check localStorage first for user preference
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && isValidLanguage(stored)) {
    return stored as SupportedLanguage;
  }

  // Try timezone-based detection first (more accurate for country)
  const timezoneLanguage = getLanguageFromTimezone();
  if (timezoneLanguage) {
    return timezoneLanguage;
  }

  // Fallback to browser language
  const browserLang = navigator.language || (navigator as any).userLanguage || "es";
  const primaryLang = browserLang.split("-")[0].toLowerCase();

  // Map common language codes to supported languages
  const languageMap: Record<string, SupportedLanguage> = {
    es: "es",
    pt: "pt",
    en: "en",
    fr: "fr",
    // Regional variants
    ca: "es", // Catalan -> Spanish
    gl: "es", // Galician -> Spanish
    eu: "es", // Basque -> Spanish
    it: "fr", // Italian -> French (Romance language)
    de: "en", // German -> English
    nl: "en", // Dutch -> English
  };

  return languageMap[primaryLang] || "es"; // Default to Spanish
}

function isValidLanguage(lang: string): lang is SupportedLanguage {
  return ["es", "pt", "en", "fr"].includes(lang);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => detectBrowserLanguage());

  useEffect(() => {
    // Persist language preference
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    // Update document language attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
  };

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      let text = translations[language]?.[key] || translations.es[key] || key;
      
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          text = text.replace(`{${param}}`, String(value));
        });
      }
      
      return text;
    };
  }, [language]);

  const languageName = useMemo(() => LANGUAGE_NAMES[language], [language]);

  const supportedLanguages = useMemo(
    () => Object.entries(LANGUAGE_NAMES) as [SupportedLanguage, string][],
    []
  );

  return (
    <LanguageContext.Provider value={{ language, languageName, setLanguage, t, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
