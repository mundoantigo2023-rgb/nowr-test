import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";
import { NowrIcon } from "@/components/NowrLogo";
import { useMatchSound } from "@/hooks/useMatchSound";

// Animated particle component for Prime users
const PrimeParticle = ({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) => (
  <div
    className="absolute pointer-events-none animate-prime-float"
    style={{
      left: `${left}%`,
      bottom: '-10px',
      width: size,
      height: size,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    <div 
      className="w-full h-full rounded-full"
      style={{
        background: 'linear-gradient(135deg, hsl(45 100% 60%) 0%, hsl(35 100% 50%) 100%)',
        boxShadow: '0 0 8px hsl(45 100% 60% / 0.6)',
      }}
    />
  </div>
);

// Sparkle component for Prime
const PrimeSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <div
    className="absolute w-2 h-2 pointer-events-none animate-prime-sparkle"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animationDelay: `${delay}s`,
    }}
  >
    <svg viewBox="0 0 24 24" className="w-full h-full fill-amber-400">
      <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
    </svg>
  </div>
);

const MatchScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const matchedProfile = location.state?.matchedProfile;
  const [currentUserPhoto, setCurrentUserPhoto] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isPrime, setIsPrime] = useState(false);
  const { track } = useAnalytics();
  const { playMatchSound } = useMatchSound();
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (!matchedProfile) {
      navigate("/home");
      return;
    }

    // Fetch current user's photo, match ID, and Prime status
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("photos, is_prime")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile?.photos?.[0]) {
          setCurrentUserPhoto(profile.photos[0]);
        }
        setIsPrime(profile?.is_prime || false);
        
        // Play celebration sound when Prime status is loaded
        if (!soundPlayedRef.current) {
          soundPlayedRef.current = true;
          setTimeout(() => {
            playMatchSound(profile?.is_prime || false);
          }, 400); // Delay to sync with animation
        }

        // Find the match
        const { data: match } = await supabase
          .from("matches")
          .select("id")
          .or(`and(user_a.eq.${session.user.id},user_b.eq.${matchedProfile.user_id}),and(user_a.eq.${matchedProfile.user_id},user_b.eq.${session.user.id})`)
          .order("matched_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (match) {
          setMatchId(match.id);
          // Track match screen view
          track("match_screen_viewed", { 
            matchId: match.id, 
            otherUserId: matchedProfile.user_id 
          });
        }
      }
    };

    fetchData();

    // Animation sequence - smooth entry with proper timing
    const timer1 = setTimeout(() => setAnimationPhase(1), 150);
    const timer2 = setTimeout(() => setAnimationPhase(2), 650);
    const timer3 = setTimeout(() => setAnimationPhase(3), 1150);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [matchedProfile, navigate, track]);

  if (!matchedProfile) return null;

  const matchedPhoto = matchedProfile.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchedProfile.user_id}`;
  const userPhoto = currentUserPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=current-user`;

  const handleOpenChat = () => {
    if (matchId) {
      track("match_chat_started", { matchId, otherUserId: matchedProfile.user_id });
      navigate(`/chat/${matchId}`);
    } else {
      navigate("/matches");
    }
  };

  const handleLater = () => {
    track("match_deferred", { matchId, otherUserId: matchedProfile.user_id });
    navigate("/home");
  };

  // Generate random particles for Prime users
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    size: 4 + Math.random() * 6,
    left: 10 + Math.random() * 80,
    duration: 3 + Math.random() * 2,
  }));

  const sparkles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: 15 + Math.random() * 70,
    y: 20 + Math.random() * 40,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient layers - premium dark with subtle depth */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
        
        {/* Central glow - soft violet for regular, golden for Prime */}
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full transition-all duration-[700ms] ease-out",
            animationPhase >= 2 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-75"
          )}
          style={{
            background: isPrime
              ? 'radial-gradient(circle, hsl(45 100% 50% / 0.15) 0%, hsl(35 100% 45% / 0.08) 50%, transparent 70%)'
              : 'radial-gradient(circle, hsl(256 100% 68% / 0.15) 0%, hsl(256 100% 68% / 0.05) 50%, transparent 70%)'
          }}
        />
        
        {/* Secondary ambient glow */}
        <div 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[60px] transition-all duration-500 delay-200",
            animationPhase >= 2 ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: isPrime ? 'hsl(45 100% 50% / 0.2)' : 'hsl(256 100% 68% / 0.2)'
          }}
        />

        {/* Prime exclusive: Floating particles */}
        {isPrime && animationPhase >= 2 && (
          <>
            {particles.map((p) => (
              <PrimeParticle key={p.id} {...p} />
            ))}
          </>
        )}

        {/* Prime exclusive: Sparkles */}
        {isPrime && animationPhase >= 3 && (
          <>
            {sparkles.map((s) => (
              <PrimeSparkle key={s.id} {...s} />
            ))}
          </>
        )}
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
        
        {/* NOWR Logo - premium brand presence + Prime crown */}
        <div 
          className={cn(
            "mb-10 transition-all duration-500 ease-out relative",
            animationPhase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}
        >
          {/* Prime crown indicator */}
          {isPrime && animationPhase >= 2 && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-prime-bounce">
              <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            </div>
          )}
          <NowrIcon size={48} animated />
        </div>

        {/* Photos section - circular with soft glow */}
        <div className="relative flex items-center justify-center mb-10 h-40">
          {/* Prime exclusive: Rotating ring behind photos */}
          {isPrime && animationPhase >= 2 && (
            <div 
              className="absolute w-44 h-44 rounded-full animate-prime-rotate pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, transparent, hsl(45 100% 50% / 0.3), transparent, hsl(45 100% 50% / 0.2), transparent)',
              }}
            />
          )}

          {/* Current user photo - comes from left */}
          <div 
            className={cn(
              "absolute w-32 h-32 rounded-full overflow-hidden border-4 shadow-2xl transition-all duration-[600ms] ease-out z-10",
              isPrime ? "border-amber-500/60" : "border-card",
              animationPhase >= 1 
                ? "translate-x-[-45px] opacity-100" 
                : "translate-x-[-140px] opacity-0"
            )}
            style={{
              boxShadow: animationPhase >= 2 
                ? isPrime
                  ? '0 8px 40px hsl(0 0% 0% / 0.5), 0 0 25px hsl(45 100% 50% / 0.3)' 
                  : '0 8px 40px hsl(0 0% 0% / 0.5), 0 0 20px hsl(256 100% 68% / 0.2)'
                : '0 8px 40px hsl(0 0% 0% / 0.5)'
            }}
          >
            <img
              src={userPhoto}
              alt="Tu perfil"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Connection indicator - subtle pulse (golden for Prime) */}
          <div 
            className={cn(
              "absolute w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all duration-500",
              isPrime ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-primary",
              animationPhase >= 2 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-0"
            )}
            style={{
              boxShadow: isPrime 
                ? '0 0 30px hsl(45 100% 50% / 0.6)' 
                : '0 0 30px hsl(256 100% 68% / 0.5)'
            }}
          >
            <div 
              className={cn(
                "w-3 h-3 rounded-full",
                isPrime ? "bg-white" : "bg-primary-foreground",
                animationPhase >= 2 && "animate-pulse"
              )}
            />
          </div>

          {/* Matched profile photo - comes from right with glow ring */}
          <div 
            className={cn(
              "absolute w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-[600ms] ease-out",
              isPrime ? "border-amber-500" : "border-primary",
              animationPhase >= 1 
                ? "translate-x-[45px] opacity-100" 
                : "translate-x-[140px] opacity-0"
            )}
            style={{
              boxShadow: animationPhase >= 2 
                ? isPrime
                  ? '0 8px 40px hsl(0 0% 0% / 0.5), 0 0 35px hsl(45 100% 50% / 0.5)' 
                  : '0 8px 40px hsl(0 0% 0% / 0.5), 0 0 30px hsl(256 100% 68% / 0.4)'
                : '0 8px 40px hsl(0 0% 0% / 0.5)'
            }}
          >
            <img
              src={matchedPhoto}
              alt={matchedProfile.display_name}
              className="w-full h-full object-cover"
            />
            {/* Glow ring animation - golden for Prime */}
            {animationPhase >= 2 && (
              <div 
                className={cn(
                  "absolute inset-[-4px] rounded-full pointer-events-none",
                  isPrime ? "animate-prime-glow" : "animate-pulse"
                )}
                style={{
                  boxShadow: isPrime 
                    ? '0 0 30px hsl(45 100% 50% / 0.6)' 
                    : '0 0 25px hsl(256 100% 68% / 0.5)',
                  animationDuration: '1.5s'
                }}
              />
            )}
          </div>
        </div>

        {/* Text content - emotional copy */}
        <div 
          className={cn(
            "transition-all duration-500 ease-out delay-100",
            animationPhase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h1 
            className={cn(
              "font-display text-4xl font-bold mb-4 tracking-tight",
              isPrime 
                ? "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]" 
                : "text-foreground"
            )}
          >
            ¡Es un match!
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xs mx-auto">
            La curiosidad fue mutua. Ahora la conexión empieza.
          </p>
        </div>

        {/* Match with name */}
        <div 
          className={cn(
            "mt-6 transition-all duration-500 ease-out delay-200",
            animationPhase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <p className="text-sm text-muted-foreground">
            con{" "}
            <span className="text-primary font-semibold">
              {matchedProfile.display_name}
            </span>
          </p>
        </div>

        {/* Action buttons */}
        <div 
          className={cn(
            "flex flex-col gap-3 w-full mt-10 transition-all duration-500 ease-out delay-300",
            animationPhase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Primary action - Open chat (golden for Prime) */}
          <Button
            onClick={handleOpenChat}
            className={cn(
              "h-14 text-base font-semibold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5",
              isPrime 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black" 
                : "gradient-primary"
            )}
            style={{
              boxShadow: isPrime 
                ? '0 8px 30px hsl(45 100% 50% / 0.4)' 
                : '0 8px 30px hsl(256 100% 68% / 0.35)'
            }}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Abrir chat de conversación
          </Button>

          {/* Secondary action - Later */}
          <Button
            variant="ghost"
            className="h-12 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            onClick={handleLater}
          >
            <Clock className="w-4 h-4 mr-2" />
            Más tarde
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchScreen;
