import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NowrLogo } from "@/components/NowrLogo";

const Splash = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Auto-navigate after 2.5 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        navigate("/welcome");
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
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
