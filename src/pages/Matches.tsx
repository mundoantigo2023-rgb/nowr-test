import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NowrLogoLoader } from "@/components/NowrLogo";
import BottomNav from "@/components/BottomNav";
import MatchRetentionBanner from "@/components/MatchRetentionBanner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Match {
  id: string;
  user_a: string;
  user_b: string;
  matched_at: string;
  expires_at: string | null;
  other_profile: {
    display_name: string;
    photos: string[];
    online_status: boolean | null;
    is_prime: boolean | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  } | null;
}

const Matches = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userIsPrime, setUserIsPrime] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/"); return; }
      setUserId(session.user.id);

      // Get user's prime status
      const { data: userProfile } = await (supabase
        .from("profiles") as any)
        .select("is_prime")
        .eq("user_id", session.user.id)
        .single();
      setUserIsPrime((userProfile as any)?.is_prime || false);

      // Get matches
      const { data } = await (supabase
        .from("matches") as any)
        .select("*")
        .or(`user_a.eq.${session.user.id},user_b.eq.${session.user.id}`)
        .order("matched_at", { ascending: false });

      if (data) {
        const enriched = await Promise.all(data.map(async (match: any) => {
          const otherId = match.user_a === session.user.id ? match.user_b : match.user_a;

          // Get other user's profile
          const { data: profile } = await (supabase
            .from("profiles") as any)
            .select("display_name, photos, online_status, is_prime")
            .eq("user_id", otherId)
            .single();

          // Get last message
          const { data: lastMsg } = await (supabase
            .from("messages") as any)
            .select("content, created_at")
            .eq("match_id", match.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...match,
            other_profile: profile || { display_name: "Usuario", photos: [], online_status: false, is_prime: false },
            last_message: lastMsg,
          };
        }));
        setMatches(enriched);
      }
      setLoading(false);
    };
    fetchMatches();
  }, [navigate]);

  // Subscribe to new messages for updating last message
  useEffect(() => {
    if (!userId || matches.length === 0) return;

    const matchIds = matches.map(m => m.id);
    const channel = supabase
      .channel("matches-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as { match_id: string; content: string; created_at: string };
          if (matchIds.includes(newMsg.match_id)) {
            setMatches(prev => prev.map(m =>
              m.id === newMsg.match_id
                ? { ...m, last_message: { content: newMsg.content, created_at: newMsg.created_at } }
                : m
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, matches.length]);

  const isExpired = (match: Match) => {
    if (!match.expires_at) return false;
    if (userIsPrime || match.other_profile.is_prime) return false;
    return new Date(match.expires_at) < new Date();
  };

  // Count expiring matches (within next 10 minutes)
  const expiringCount = matches.filter(match => {
    if (!match.expires_at || userIsPrime || match.other_profile.is_prime) return false;
    const expiresAt = new Date(match.expires_at);
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    return expiresAt > now && expiresAt <= tenMinutesFromNow;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">{t("messages")}</h1>
        </div>
      </header>

      <main className="p-4">
        {matches.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">{t("allStartsHere")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
              {t("whenYouConnect")}
            </p>
            <Button onClick={() => navigate("/home")}>
              {t("explore")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <MatchRetentionBanner
              matchesCount={matches.length}
              expiringCount={expiringCount}
              isPrime={userIsPrime}
            />
            {matches.map((match) => {
              const expired = isExpired(match);
              const photo = match.other_profile.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.id}`;

              return (
                <button
                  key={match.id}
                  onClick={() => navigate(`/chat/${match.id}`)}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-xl transition-all",
                    expired ? "bg-muted/30 opacity-60" : "bg-card hover:bg-secondary/50 border border-border/30"
                  )}
                >
                  <div className="relative">
                    <img
                      src={photo}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    {match.other_profile.online_status && !expired && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-online rounded-full border-2 border-card" />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate text-foreground">{match.other_profile.display_name}</p>
                      {match.other_profile.is_prime && <Crown className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    {expired ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t("chatExpired")}
                      </p>
                    ) : match.last_message ? (
                      <p className="text-sm text-muted-foreground truncate">
                        {match.last_message.content}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("tapToChat")}</p>
                    )}
                  </div>

                  {match.last_message && !expired && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(match.last_message.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Matches;
