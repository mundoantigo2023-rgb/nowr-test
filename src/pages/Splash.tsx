import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NowrLogo } from "@/components/NowrLogo";

const Splash = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      // Minimum visual time for splash to be seen
      const minSplashTime = 2000;
      const startTime = Date.now();

      // Check current session
      const { data: { session } } = await supabase.auth.getSession();

      // Calculate remaining time to wait
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minSplashTime - elapsedTime);

      setTimeout(() => {
        setFadeOut(true);

        setTimeout(() => {
          if (session) {
            navigate("/home");
          } else {
            navigate("/welcome");
          }
        }, 500); // Wait for fade out animation
      }, remainingTime);
    };

    checkSession();
  }, [navigate]);

  return (
    <div
      className={`min-h-screen bg-background flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      {/* Logo with pulse animation */}
      <div className="relative z-10 splash-pulse">
        <NowrLogo size="xl" animated showText />
      </div>
    </div>
  );
};

export default Splash;
