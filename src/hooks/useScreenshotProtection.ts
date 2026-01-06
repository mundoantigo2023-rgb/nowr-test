import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScreenshotEvent {
  id: string;
  match_id: string;
  user_id: string;
  created_at: string;
}

export const useScreenshotProtection = (
  matchId: string | undefined,
  userId: string | null,
  otherUserName: string | undefined
) => {
  const { toast } = useToast();
  const lastEventRef = useRef<string | null>(null);
  const [recentReport, setRecentReport] = useState(false);

  // Record a screenshot event (can be called manually for reporting)
  const recordScreenshot = useCallback(async (isManualReport = false) => {
    if (!matchId || !userId) return;

    // Prevent spam - only allow one report per 30 seconds
    if (recentReport && isManualReport) {
      toast({
        title: "Espera un momento",
        description: "Ya has reportado una captura recientemente",
      });
      return;
    }

    try {
      await supabase.from("screenshot_events").insert({
        match_id: matchId,
        user_id: userId,
      });

      if (isManualReport) {
        setRecentReport(true);
        setTimeout(() => setRecentReport(false), 30000);
        
        toast({
          title: "📸 Reporte enviado",
          description: `${otherUserName || "El otro usuario"} ha sido notificado de tu sospecha de captura.`,
        });
      } else {
        toast({
          title: "⚠️ Captura detectada",
          description: "El otro usuario ha sido notificado de tu captura de pantalla.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error recording screenshot:", error);
    }
  }, [matchId, userId, otherUserName, toast, recentReport]);

  // Report a suspected screenshot (manual action)
  const reportScreenshot = useCallback(() => {
    recordScreenshot(true);
  }, [recordScreenshot]);

  // Detect screenshot keyboard shortcuts
  useEffect(() => {
    if (!matchId || !userId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      // Windows: PrintScreen, Win+Shift+S, Win+PrintScreen
      const isMacScreenshot =
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) ||
        (e.metaKey && e.ctrlKey && e.shiftKey && e.key === "4");

      const isWindowsScreenshot =
        e.key === "PrintScreen" ||
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === "s");

      if (isMacScreenshot || isWindowsScreenshot) {
        recordScreenshot(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [matchId, userId, recordScreenshot]);

  // Listen for screenshot events from the other user
  useEffect(() => {
    if (!matchId || !userId) return;

    const channel = supabase
      .channel(`screenshot-events-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "screenshot_events",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const event = payload.new as ScreenshotEvent;

          // Only show notification if it's from the other user
          // and it's not a duplicate
          if (event.user_id !== userId && event.id !== lastEventRef.current) {
            lastEventRef.current = event.id;

            toast({
              title: "📸 Alerta de captura",
              description: `${otherUserName || "El otro usuario"} sospecha que has tomado una captura de pantalla.`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, userId, otherUserName, toast]);

  return { recordScreenshot, reportScreenshot, recentReport };
};
