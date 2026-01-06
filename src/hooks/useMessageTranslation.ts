import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectBrowserLanguage, SupportedLanguage } from "./useUserLanguage";

interface TranslationCache {
  [key: string]: string;
}

// FREE tier translation limits
const FREE_MAX_MESSAGE_LENGTH = 50; // Only translate short messages for free users
const FREE_DAILY_LIMIT = 10; // Max translations per day for free users

export const useMessageTranslation = (isPrime: boolean = false) => {
  const [translations, setTranslations] = useState<TranslationCache>({});
  const [translating, setTranslating] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [dailyTranslations, setDailyTranslations] = useState(0);
  const userLanguage = detectBrowserLanguage();
  
  // Track pending translations to prevent duplicates
  const pendingTranslations = useRef<Set<string>>(new Set());
  // Queue for sequential processing
  const translationQueue = useRef<Array<{ messageId: string; text: string; targetLanguage: SupportedLanguage }>>([]);
  const isProcessingQueue = useRef(false);

  const detectLanguage = (text: string): string => {
    // Simple language detection based on character patterns
    const spanishPattern = /[áéíóúüñ¿¡]/i;
    const portuguesePattern = /[ãõç]/i;
    const frenchPattern = /[àâäçéèêëîïôùûü]/i;
    const germanPattern = /[äöüß]/i;
    
    // Check for common words
    const spanishWords = /\b(que|de|en|el|la|es|un|una|los|las|por|con)\b/i;
    const englishWords = /\b(the|is|are|was|were|have|has|been|will|would|could|should|this|that|with|from)\b/i;
    const portugueseWords = /\b(que|de|em|um|uma|os|as|por|com|você|isso|está)\b/i;
    
    if (spanishPattern.test(text) || spanishWords.test(text)) return "es";
    if (portuguesePattern.test(text) || portugueseWords.test(text)) return "pt";
    if (frenchPattern.test(text)) return "fr";
    if (germanPattern.test(text)) return "de";
    if (englishWords.test(text)) return "en";
    
    return "unknown";
  };

  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || translationQueue.current.length === 0 || rateLimited) {
      return;
    }

    isProcessingQueue.current = true;

    while (translationQueue.current.length > 0 && !rateLimited) {
      const item = translationQueue.current.shift();
      if (!item) break;

      const { messageId, text, targetLanguage } = item;
      const cacheKey = `${messageId}-${targetLanguage}`;

      // Skip if already translated or pending
      if (translations[cacheKey] || pendingTranslations.current.has(cacheKey)) {
        continue;
      }

      pendingTranslations.current.add(cacheKey);
      setTranslating(messageId);

      try {
        const { data, error } = await supabase.functions.invoke("translate-message", {
          body: { text, targetLanguage }
        });

        if (error) {
          const errorMessage = error.message || "";
          if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
            console.log("Translation rate limited, pausing for 30 seconds...");
            setRateLimited(true);
            // Auto-reset rate limit after 30 seconds
            setTimeout(() => setRateLimited(false), 30000);
            break;
          }
          console.error("Translation error:", error);
          continue;
        }

        const translatedText = data?.translatedText;
        if (translatedText && translatedText !== text) {
          setTranslations(prev => ({ ...prev, [cacheKey]: translatedText }));
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Translation failed:", error);
      } finally {
        pendingTranslations.current.delete(cacheKey);
      }
    }

    setTranslating(null);
    isProcessingQueue.current = false;
  }, [translations, rateLimited]);

  const translateMessage = useCallback(async (
    messageId: string,
    text: string,
    targetLanguage: SupportedLanguage = userLanguage
  ): Promise<string | null> => {
    const cacheKey = `${messageId}-${targetLanguage}`;
    
    // Return cached translation
    if (translations[cacheKey]) {
      return translations[cacheKey];
    }

    // Skip if already pending or rate limited
    if (pendingTranslations.current.has(cacheKey) || rateLimited) {
      return null;
    }

    // FREE tier restrictions
    if (!isPrime) {
      // Only allow short messages
      if (text.length > FREE_MAX_MESSAGE_LENGTH) {
        return null;
      }
      // Check daily limit
      if (dailyTranslations >= FREE_DAILY_LIMIT) {
        return null;
      }
      // Increment daily count
      setDailyTranslations(prev => prev + 1);
    }

    // Add to queue and process
    translationQueue.current.push({ messageId, text, targetLanguage });
    processQueue();

    return null;
  }, [translations, rateLimited, processQueue, userLanguage, isPrime, dailyTranslations]);

  // Check if translation is allowed for free users
  const canTranslate = useCallback((text: string): boolean => {
    if (isPrime) return true;
    if (text.length > FREE_MAX_MESSAGE_LENGTH) return false;
    if (dailyTranslations >= FREE_DAILY_LIMIT) return false;
    return true;
  }, [isPrime, dailyTranslations]);

  const getTranslation = (messageId: string, targetLanguage: SupportedLanguage = userLanguage): string | null => {
    const cacheKey = `${messageId}-${targetLanguage}`;
    return translations[cacheKey] || null;
  };

  return {
    detectLanguage,
    translateMessage,
    getTranslation,
    canTranslate,
    translating,
    translations,
    userLanguage,
    rateLimited,
    dailyTranslations,
    maxDailyTranslations: isPrime ? Infinity : FREE_DAILY_LIMIT,
    maxMessageLength: isPrime ? Infinity : FREE_MAX_MESSAGE_LENGTH,
  };
};
