import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useForYouNotifications } from "@/hooks/useForYouNotifications";

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize For You notifications monitoring
  useForYouNotifications(userId);

  return <>{children}</>;
};
