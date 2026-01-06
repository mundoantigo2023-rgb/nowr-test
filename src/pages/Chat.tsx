import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useMessageTranslation } from "@/hooks/useMessageTranslation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePrivateAlbum } from "@/hooks/usePrivateAlbum";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useScreenshotProtection } from "@/hooks/useScreenshotProtection";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Send, Crown, Bell, BellOff, Languages, Loader2, Camera, Eye, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NowrLogoLoader } from "@/components/NowrLogo";
import NowPikSender from "@/components/NowPik/NowPikSender";
import NowPikViewer from "@/components/NowPik/NowPikViewer";
import ChatAlbumAccess from "@/components/ChatAlbumAccess";
import PrimeUpsellPrompt from "@/components/PrimeUpsellPrompt";
import TypingIndicator from "@/components/TypingIndicator";
import ChatExpiredOverlay from "@/components/ChatExpiredOverlay";
import MessageReadReceipt from "@/components/MessageReadReceipt";
import ChatTimerDisplay from "@/components/ChatTimerDisplay";
import ChatTimePaywall from "@/components/ChatTimePaywall";
import ChatPsychologicalMessage from "@/components/ChatPsychologicalMessage";
import PresenceIndicator from "@/components/PresenceIndicator";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read?: boolean | null;
  nowpik_image_url?: string | null;
  nowpik_duration?: number | null;
  nowpik_viewed?: boolean | null;
}

interface Match {
  id: string;
  user_a: string;
  user_b: string;
  chat_started_at: string | null;
  chat_expires_at: string | null;
}

interface OtherProfile {
  display_name: string;
  photos: string[];
  online_status: boolean | null;
  is_prime: boolean | null;
  private_photos: string[] | null;
  is_test_profile: boolean | null;
  last_active: string | null;
  invisible_mode: boolean | null;
  hide_activity_status: boolean | null;
}

const CHAT_DURATION_FREE = 30 * 60 * 1000; // 30 minutes in ms - FIXED: does NOT reset with messages
const PRIME_EXTENSION_DURATION = 60 * 60 * 1000; // Prime can extend by 60 minutes

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { permission, isSupported, notificationsEnabled, toggleNotifications, requestPermission, sendNotification } = useBrowserNotifications();
  const { playNotificationSound } = useNotificationSound();
  const { track, trackConversationActivation } = useAnalytics();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
  const [isPrime, setIsPrime] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [chatExpired, setChatExpired] = useState(false);
  const [otherUserSentMessage, setOtherUserSentMessage] = useState(false);
  const [currentUserSentMessage, setCurrentUserSentMessage] = useState(false);
  const [bothHaveSent, setBothHaveSent] = useState(false);
  const [fiveMinWarningShown, setFiveMinWarningShown] = useState(false);
  const [showTimerUpsell, setShowTimerUpsell] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [showTranslations, setShowTranslations] = useState<{ [key: string]: boolean }>({});
  const [myPrivatePhotos, setMyPrivatePhotos] = useState<string[]>([]);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [timerExtended, setTimerExtended] = useState(false);
  
  // Translation hook - pass isPrime for tier-based limits
  const { detectLanguage, translateMessage, getTranslation, translating, rateLimited, canTranslate, maxMessageLength } = useMessageTranslation(isPrime);
  
  // Private album hook
  const { 
    hasAccess, 
    hasPendingRequest, 
    requestAccess, 
    respondToRequest, 
    revokeAccess,
    accessRecords,
    loading: albumLoading,
    refetch: refetchAlbumAccess
  } = usePrivateAlbum(userId || undefined);
  
  // Typing indicator hook - Prime only
  const { otherUserTyping, setTyping } = useTypingIndicator(matchId, userId, isPrime);
  
  // Screenshot protection hook
  const { reportScreenshot, recentReport } = useScreenshotProtection(matchId, userId, otherProfile?.display_name);
  
  // NowPik state
  const [viewingNowPik, setViewingNowPik] = useState<{
    imageUrl: string;
    duration: number;
    messageId: string;
    senderName: string;
  } | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/"); return; }
      setUserId(session.user.id);

      // Get user's prime status and private photos
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("is_prime, private_photos")
        .eq("user_id", session.user.id)
        .single();
      setIsPrime(userProfile?.is_prime || false);
      setMyPrivatePhotos(userProfile?.private_photos || []);

      // Get match data
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (matchError || !matchData) {
        navigate("/matches");
        return;
      }

      // Verify user is part of this match
      if (matchData.user_a !== session.user.id && matchData.user_b !== session.user.id) {
        navigate("/matches");
        return;
      }

      setMatch(matchData);

      // Get other user's profile
      const otherId = matchData.user_a === session.user.id ? matchData.user_b : matchData.user_a;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, photos, online_status, is_prime, private_photos, is_test_profile, last_active, invisible_mode, hide_activity_status")
        .eq("user_id", otherId)
        .single();

      setOtherProfile(profileData);
      setOtherUserId(otherId);
      
      // Track chat opened
      track("chat_opened", { matchId, otherUserId: otherId });

      // Get messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);

      // Mark messages from other user as read
      if (messagesData && messagesData.length > 0) {
        const unreadMessageIds = messagesData
          .filter(m => m.sender_id !== session.user.id)
          .map(m => m.id);
        
        if (unreadMessageIds.length > 0) {
          await supabase
            .from("messages")
            .update({ read: true })
            .in("id", unreadMessageIds);
        }
      }

      // Check if both users have sent messages
      const otherHasSent = messagesData?.some(m => m.sender_id === otherId);
      const currentHasSent = messagesData?.some(m => m.sender_id === session.user.id);
      setOtherUserSentMessage(!!otherHasSent);
      setCurrentUserSentMessage(!!currentHasSent);
      setBothHaveSent(!!otherHasSent && !!currentHasSent);

      // Check expiration status - if expired and user is Free, clean up immediately
      if (matchData.chat_expires_at) {
        const expiresAt = new Date(matchData.chat_expires_at).getTime();
        const now = Date.now();
        const userIsFree = !userProfile?.is_prime;
        const otherIsFree = !profileData?.is_prime;
        
        if (now >= expiresAt && userIsFree && otherIsFree) {
          // Both are Free and chat expired - delete everything immediately
          setChatExpired(true);
          
          // Delete messages and match
          await supabase.from("messages").delete().eq("match_id", matchId);
          await supabase.from("matches").delete().eq("id", matchId);
          
          // Navigate away
          navigate("/matches");
          toast({
            title: t("chatExpired"),
            description: t("conversationEnded"),
          });
          return;
        } else if (now >= expiresAt && userIsFree && !otherIsFree) {
          // User is Free, other is Prime - show expired state but Prime can reopen
          setChatExpired(true);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [matchId, navigate]);

  // Auto-translate incoming messages from other users (sequentially via queue) - Prime only
  useEffect(() => {
    if (!isPrime || !autoTranslate || !userId || rateLimited) return;

    // Only translate messages from other users that don't have translations yet
    const messagesToTranslate = messages.filter(message => {
      if (message.sender_id === userId) return false;
      const detectedLang = detectLanguage(message.content);
      if (detectedLang === "es" || detectedLang === "unknown") return false;
      const existingTranslation = getTranslation(message.id, "es");
      return !existingTranslation;
    });

    // Queue translations (the hook handles sequential processing)
    messagesToTranslate.forEach(message => {
      translateMessage(message.id, message.content, "es");
    });
  }, [messages, autoTranslate, userId, rateLimited, isPrime]);

  // Show toast when rate limited
  useEffect(() => {
    if (rateLimited) {
      toast({
        title: "Traducción pausada",
        description: "Demasiadas solicitudes. Reintentando en 30 segundos...",
        variant: "destructive",
      });
    }
  }, [rateLimited, toast]);

  // Real-time subscription for messages (INSERT and UPDATE for read receipts)
  useEffect(() => {
    if (!matchId || !userId) return;

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          // Check if other user sent a message and send notification
          if (newMsg.sender_id !== userId) {
            const wasOtherSent = otherUserSentMessage;
            setOtherUserSentMessage(true);
            
            // If this is first message from other user and current user already sent,
            // start the timer (reciprocity achieved)
            // Timer applies when NOT both Prime
            // FIXED: Timer does NOT reset with messages - it runs continuously
            const areBothPrime = isPrime && otherProfile?.is_prime;
            if (!wasOtherSent && currentUserSentMessage && !areBothPrime) {
              setBothHaveSent(true);
              // Timer will be started by startChatTimer when first reciprocal message sent
            }
            // NOTE: Removed resetChatTimer() - timer should NOT reset on messages
            
            // Play notification sound
            playNotificationSound();
            
            // Send browser notification
            sendNotification(otherProfile?.display_name || "Nuevo mensaje", {
              body: newMsg.content.length > 50 
                ? newMsg.content.substring(0, 50) + "..." 
                : newMsg.content,
              tag: `chat-${matchId}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          // Update message read status for read receipts (Prime only)
          if (isPrime) {
            const updatedMsg = payload.new as Message;
            setMessages((prev) => 
              prev.map((m) => 
                m.id === updatedMsg.id ? { ...m, read: updatedMsg.read } : m
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, userId, isPrime]);

  // Real-time subscription for match updates (to detect chat extensions by Prime user)
  useEffect(() => {
    if (!matchId || !userId || isPrime) return; // Only Free users need this

    const matchChannel = supabase
      .channel(`match-updates-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const updatedMatch = payload.new as Match;
          const oldMatch = payload.old as Match;
          
          // Detect if chat was extended (new expiration is significantly later than before)
          if (updatedMatch.chat_expires_at && oldMatch.chat_expires_at) {
            const newExpiry = new Date(updatedMatch.chat_expires_at).getTime();
            const oldExpiry = new Date(oldMatch.chat_expires_at).getTime();
            
            // If extended by more than 10 minutes (not just a message reset), show toast
            if (newExpiry - oldExpiry > 10 * 60 * 1000) {
              playNotificationSound();
              toast({
                title: `⏱️ ${t("timeExtended")}!`,
                description: `${otherProfile?.display_name || ""} ${t("connectionExtendedChat")}`,
              });
              setChatExpired(false);
              setFiveMinWarningShown(false);
              // Trigger timer animation
              setTimerExtended(true);
              setTimeout(() => setTimerExtended(false), 1500);
            }
          }
          
          // If chat was reopened from expired state
          if (updatedMatch.chat_expires_at && !oldMatch.chat_expires_at) {
            playNotificationSound();
            toast({
              title: `💬 ${t("chatReactivated")}!`,
              description: `${otherProfile?.display_name || ""} ${t("connectionReopenedChat")}`,
            });
            setChatExpired(false);
          }
          
          // Update local match state
          setMatch(updatedMatch);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [matchId, userId, isPrime, otherProfile?.display_name, playNotificationSound, toast]);

  // Determine if chat has timer (only when NOT both Prime)
  const bothArePrime = isPrime && otherProfile?.is_prime;
  
  // Timer countdown - show for all non-Prime-to-Prime chats
  useEffect(() => {
    if (!match) return;
    
    // Both Prime = unlimited, no timer at all
    if (bothArePrime) {
      setTimeRemaining(null);
      return;
    }

    // Don't show timer until both users have sent at least one message
    if (!bothHaveSent || !match.chat_expires_at) {
      setTimeRemaining(null);
      return;
    }

    const expiresAt = new Date(match.chat_expires_at).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = expiresAt - now;
      
      if (remaining <= 0) {
        setChatExpired(true);
        setTimeRemaining(0);
        clearInterval(interval);
        
        // Delete messages and match when chat expires for Free-to-Free chats
        // For Free-to-Prime chats, Free user sees expired overlay, Prime can reopen
        if (!isPrime && !otherProfile?.is_prime) {
          // Both Free - delete everything
          handleChatExpiration();
        }
        // If user is Free and other is Prime, just show expired state (Prime can reopen)
      } else {
        setTimeRemaining(remaining);
        
        // Send 5-minute warning notification and show upsell (only for Free users)
        const fiveMinutes = 5 * 60 * 1000;
        if (remaining <= fiveMinutes && remaining > fiveMinutes - 1000 && !fiveMinWarningShown && !isPrime) {
          setFiveMinWarningShown(true);
          setShowTimerUpsell(true);
          
          // Play notification sound
          playNotificationSound();
          
          // Send browser push notification
          sendNotification(`⏱️ ${t("fiveMinutesLeft")}`, {
            body: `${t("fiveMinutesLeft")} - ${otherProfile?.display_name || ""}`,
            tag: `timer-warning-${matchId}`,
          });
          
          // Show toast notification
          toast({
            title: `⏱️ ${t("fiveMinutesLeft")}`,
            description: t("goPrimeToExtend"),
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [match, isPrime, bothArePrime, bothHaveSent, fiveMinWarningShown, otherProfile?.display_name, matchId, playNotificationSound, sendNotification, toast]);

  // Reset 5-min warning and upsell when timer is reset
  useEffect(() => {
    if (timeRemaining && timeRemaining > 5 * 60 * 1000) {
      setFiveMinWarningShown(false);
      setShowTimerUpsell(false);
    }
  }, [timeRemaining]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const startChatTimer = async () => {
    if (!match) return;

    const expiresAt = new Date(Date.now() + CHAT_DURATION_FREE);
    
    await supabase
      .from("matches")
      .update({
        chat_started_at: new Date().toISOString(),
        chat_expires_at: expiresAt.toISOString(),
      })
      .eq("id", match.id);

    setMatch({
      ...match,
      chat_started_at: new Date().toISOString(),
      chat_expires_at: expiresAt.toISOString(),
    });
    
    setBothHaveSent(true);
  };

  // REMOVED: resetChatTimer function - timer should NEVER reset on messages
  // The timer runs continuously from chat_started_at to chat_expires_at
  // Only Prime users can EXTEND time (not reset)

  // Handle chat expiration - delete messages and remove match from list
  const handleChatExpiration = async () => {
    if (!matchId || !match) return;
    
    try {
      // Delete all messages from this match
      await supabase
        .from("messages")
        .delete()
        .eq("match_id", matchId);
      
      // Delete the match itself
      await supabase
        .from("matches")
        .delete()
        .eq("id", matchId);
      
      // Navigate back to matches after a short delay
      setTimeout(() => {
        navigate("/matches");
        toast({
          title: t("chatExpired"),
          description: t("conversationEnded"),
        });
      }, 2000);
      
      track("chat_expired", { matchId });
    } catch (error) {
      console.error("Error cleaning up expired chat:", error);
    }
  };
  
  // Extend chat (Prime only, when chatting with Free user)
  const handleExtendChat = async () => {
    if (!match || !isPrime) return;

    const expiresAt = new Date(Date.now() + PRIME_EXTENSION_DURATION);
    
    await supabase
      .from("matches")
      .update({
        chat_expires_at: expiresAt.toISOString(),
      })
      .eq("id", match.id);

    setMatch({
      ...match,
      chat_expires_at: expiresAt.toISOString(),
    });

    setChatExpired(false);
    setFiveMinWarningShown(false);
    setShowTimerUpsell(false);

    toast({
      title: t("chatExtended"),
      description: t("extendedBy60Min"),
    });

    // Trigger timer animation
    setTimerExtended(true);
    setTimeout(() => setTimerExtended(false), 1500);

    track("chat_extended", { matchId });
  };

  // Reopen expired chat (Prime only)
  const handleReopenChat = async () => {
    if (!match || !isPrime) return;

    // If other user is also Prime, make chat unlimited
    // If other user is Free, extend by 60 minutes
    if (otherProfile?.is_prime) {
      // Both Prime - unlimited chat
      await supabase
        .from("matches")
        .update({
          chat_expires_at: null,
          chat_started_at: null,
        })
        .eq("id", match.id);

      setMatch({
        ...match,
        chat_expires_at: null,
        chat_started_at: null,
      });

      toast({
        title: t("chatReopened"),
        description: t("unlimitedChatPrime"),
      });
    } else {
      // Prime + Free - extend by 60 minutes
      const expiresAt = new Date(Date.now() + PRIME_EXTENSION_DURATION);
      
      await supabase
        .from("matches")
        .update({
          chat_expires_at: expiresAt.toISOString(),
        })
        .eq("id", match.id);

      setMatch({
        ...match,
        chat_expires_at: expiresAt.toISOString(),
      });

      toast({
        title: t("chatReactivated"),
        description: t("extendedBy60Min"),
      });
    }

    setChatExpired(false);
    setBothHaveSent(true);
    setFiveMinWarningShown(false);
    setShowTimerUpsell(false);

    track("chat_reopened", { matchId });
  };

  // Check if the other user is a test profile (auto-replies enabled)
  const isTestProfile = otherProfile?.is_test_profile === true;

  const triggerAutoReply = async (messageContent: string, otherId: string) => {
    try {
      await supabase.functions.invoke("auto-reply", {
        body: {
          matchId,
          messageContent,
          botUserId: otherId,
        },
      });
    } catch (error) {
      console.error("Auto-reply error:", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if chat is expired (either locally or by checking match expiration time)
    const isExpired = chatExpired || (match?.chat_expires_at && new Date(match.chat_expires_at).getTime() <= Date.now() && !bothArePrime);
    
    if (!newMessage.trim() || !userId || !matchId || sending || isExpired) {
      if (isExpired && !isPrime) {
        // Free user trying to send after expiration - trigger expiration flow
        setChatExpired(true);
        handleChatExpiration();
        toast({
          title: t("chatExpired"),
          description: t("conversationEnded"),
          variant: "destructive",
        });
      }
      return;
    }

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");
    
    // Stop typing indicator when sending
    if (isPrime) {
      setTyping(false);
    }

    try {
      // Check if this is first message from current user
      const userHasSent = currentUserSentMessage || messages.some(m => m.sender_id === userId);
      const isFirstMessage = !userHasSent;
      
      // Insert message
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: userId,
        content: messageContent,
      });

      if (error) throw error;

      // Update local state for current user having sent
      if (!userHasSent) {
        setCurrentUserSentMessage(true);
      }

      // Track message sent with activation metrics
      const otherId = match?.user_a === userId ? match?.user_b : match?.user_a;
      trackConversationActivation(matchId, otherId || "", isFirstMessage);
      track("chat_message_sent", { 
        matchId, 
        isFirstMessage,
        messageCount: messages.length + 1
      });

      // Check if both have now sent and timer should start
      const nowBothHaveSent = (userHasSent || true) && otherUserSentMessage;
      
      // Timer applies when NOT both Prime
      // FIXED: Timer only STARTS once, never resets on messages
      if (!bothArePrime) {
        if (!bothHaveSent && nowBothHaveSent) {
          // First time both have sent - start timer ONCE
          await startChatTimer();
        }
        // NOTE: Removed resetChatTimer() - timer runs continuously
      }

      // Trigger auto-reply if chatting with test profile
      if (isTestProfile && otherId) {
        triggerAutoReply(messageContent, otherId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const toggleShowTranslation = (messageId: string) => {
    setShowTranslations(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleManualTranslate = async (message: Message) => {
    const translated = await translateMessage(message.id, message.content, "es");
    if (translated) {
      setShowTranslations(prev => ({ ...prev, [message.id]: true }));
    }
  };

  // NowPik handlers
  const handleSendNowPik = async (imageUrl: string, duration: number) => {
    if (!userId || !matchId) return;
    
    try {
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: userId,
        content: "📸 NowPik",
        is_temporary: true,
        nowpik_image_url: imageUrl,
        nowpik_duration: duration,
        nowpik_viewed: false,
      });

      if (error) throw error;
      
      // Track NowPik sent
      track("chat_nowpik_sent", { matchId, duration });
    } catch (error) {
      console.error("Error sending NowPik:", error);
      throw error;
    }
  };

  const handleViewNowPik = (message: Message) => {
    if (!message.nowpik_image_url || !message.nowpik_duration) return;
    
    setViewingNowPik({
      imageUrl: message.nowpik_image_url,
      duration: message.nowpik_duration,
      messageId: message.id,
      senderName: otherProfile?.display_name || "Usuario",
    });
  };

  const handleNowPikViewed = async () => {
    if (!viewingNowPik) return;
    
    try {
      await supabase
        .from("messages")
        .update({ 
          nowpik_viewed: true,
          nowpik_viewed_at: new Date().toISOString(),
        })
        .eq("id", viewingNowPik.messageId);
      
      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === viewingNowPik.messageId 
          ? { ...m, nowpik_viewed: true }
          : m
      ));
    } catch (error) {
      console.error("Error marking NowPik as viewed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }

  const photo = otherProfile?.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchId}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/matches")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <img
                src={photo}
                alt={otherProfile?.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {otherProfile?.online_status && !(otherProfile.is_prime && otherProfile.invisible_mode) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate text-foreground">{otherProfile?.display_name}</p>
                {otherProfile?.is_prime && <Crown className="w-4 h-4 text-prime animate-prime-shimmer" />}
              </div>
              {/* Presence indicator */}
              <PresenceIndicator
                lastActive={otherProfile?.last_active || null}
                isOnline={otherProfile?.online_status || false}
                isPrime={isPrime}
                hideActivityStatus={otherProfile?.hide_activity_status || false}
                isInvisible={(otherProfile?.is_prime && otherProfile?.invisible_mode) || false}
                variant="text"
                size="sm"
              />
            </div>
          </div>

          {/* Timer - visible when NOT both Prime and both have sent messages */}
          {timeRemaining !== null && bothHaveSent && !bothArePrime && (
            <ChatTimerDisplay 
              timeRemaining={timeRemaining} 
              timerExtended={timerExtended}
            />
          )}

          {/* Prime extension badge - shows when Prime user can extend (Prime + Free chat) */}
          {isPrime && !otherProfile?.is_prime && bothHaveSent && !chatExpired && (
            <button
              onClick={handleExtendChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-prime/20 to-prime-glow/20 text-prime text-xs font-medium border border-prime/30 hover:from-prime/30 hover:to-prime-glow/30 transition-all animate-prime-shimmer"
              title="Extender chat 60 minutos"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+60 min</span>
              <span className="sm:hidden">+60</span>
            </button>
          )}

          {/* Unlimited badge only when BOTH are Prime */}
          {bothArePrime && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-prime/20 to-prime-glow/20 text-prime text-xs font-medium border border-prime/30 animate-prime-shimmer">
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("unlimitedChat")}</span>
              <span className="sm:hidden">∞</span>
            </div>
          )}

          {/* Auto-translate toggle - Prime only */}
          {isPrime && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setAutoTranslate(!autoTranslate);
                toast({
                  title: autoTranslate ? t("translationDisabled") : t("translationEnabled"),
                  description: autoTranslate 
                    ? t("messagesWontTranslate") 
                    : t("messagesWillTranslate"),
                });
              }}
              className="relative"
            >
              <Languages className={cn("h-5 w-5", autoTranslate ? "text-primary" : "text-muted-foreground")} />
            </Button>
          )}

          {/* Notification toggle */}
          {isSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (permission !== "granted") {
                  requestPermission().then(granted => {
                    if (granted) {
                      toast({
                        title: t("notificationsActivated"),
                        description: t("receiveAlerts"),
                      });
                    } else {
                      toast({
                        title: t("permissionDenied"),
                        description: t("enableInBrowser"),
                        variant: "destructive",
                      });
                    }
                  });
                } else {
                  toggleNotifications();
                  toast({
                    title: notificationsEnabled ? t("notificationsDeactivated") : t("notificationsActivated"),
                    description: notificationsEnabled 
                      ? t("noAlertsFromChat") 
                      : t("receiveAlerts"),
                  });
                }
              }}
              className="relative"
            >
              {permission === "granted" && notificationsEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          )}

          {/* Report Screenshot Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={reportScreenshot}
            disabled={recentReport}
            title={t("reportScreenshot")}
            className="relative"
          >
            <Shield className={cn("h-5 w-5", recentReport ? "text-muted-foreground" : "text-foreground")} />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Private Album Access Section */}
        {otherUserId && (otherProfile?.private_photos?.length || myPrivatePhotos.length > 0) && (
          <ChatAlbumAccess
            otherUserId={otherUserId}
            otherUserName={otherProfile?.display_name || "Usuario"}
            otherUserPhotos={otherProfile?.private_photos || []}
            hasAccessToOther={hasAccess(otherUserId)}
            hasPendingToOther={hasPendingRequest(otherUserId)}
            otherHasAccessToMe={accessRecords.some(r => r.requester_id === otherUserId && r.owner_id === userId && r.status === "granted")}
            otherHasPendingToMe={accessRecords.some(r => r.requester_id === otherUserId && r.owner_id === userId && r.status === "pending")}
            myPrivatePhotos={myPrivatePhotos}
            onRequestAccess={async () => {
              const success = await requestAccess(otherUserId);
              return success;
            }}
            onGrantAccess={async () => {
              const success = await respondToRequest(otherUserId, true);
              return success;
            }}
            onDenyAccess={async () => {
              const success = await respondToRequest(otherUserId, false);
              return success;
            }}
            onRevokeAccess={async () => {
              const success = await revokeAccess(otherUserId);
              return success;
            }}
            loading={albumLoading}
          />
        )}

        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium">{t("noPressure")}</p>
            <p className="text-sm mt-1">{t("sayWhatYouWant")}</p>
            {!isPrime && !otherProfile?.is_prime && (
              <p className="text-xs mt-4 text-muted-foreground/70">
                {t("timeRunsWhenBothReply")}
              </p>
            )}
          </div>
        )}

        {/* Psychological message - based on time remaining */}
        {timeRemaining !== null && bothHaveSent && !bothArePrime && (
          <ChatPsychologicalMessage
            timeRemaining={timeRemaining}
            chatExpired={chatExpired}
            isPrime={isPrime}
          />
        )}

        {/* Dynamic Paywall - based on time remaining */}
        {timeRemaining !== null && bothHaveSent && !bothArePrime && !chatExpired && (
          <ChatTimePaywall
            timeRemaining={timeRemaining}
            chatExpired={chatExpired}
            isPrime={isPrime}
            otherUserName={otherProfile?.display_name || "Usuario"}
            onExtend={handleExtendChat}
            onReopen={handleReopenChat}
          />
        )}

        {messages.map((message) => {
          const isOwn = message.sender_id === userId;
          const isNowPik = !!message.nowpik_image_url;
          const nowPikViewed = message.nowpik_viewed;
          const translation = getTranslation(message.id, "es");
          const showingTranslation = showTranslations[message.id];
          const isTranslating = translating === message.id;
          const detectedLang = !isOwn ? detectLanguage(message.content) : null;
          // Use canTranslate from hook which respects FREE tier limits (message length, daily count)
          const messageCanTranslate = !isOwn && detectedLang && detectedLang !== "es" && detectedLang !== "unknown" && !isNowPik && canTranslate(message.content);

          // NowPik message rendering
          if (isNowPik) {
            return (
              <div
                key={message.id}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <div className="flex flex-col max-w-[75%]">
                  {isOwn ? (
                    // Sender view - show sent status
                    <div className="px-4 py-3 rounded-2xl bg-primary/20 border border-primary/30 rounded-br-md">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">NowPik enviado</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {nowPikViewed ? "✓ Visto" : `${message.nowpik_duration}s • Esperando visualización`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ) : (
                    // Receiver view - show tap to view
                    <button
                      onClick={() => !nowPikViewed && handleViewNowPik(message)}
                      disabled={nowPikViewed}
                      className={cn(
                        "px-4 py-3 rounded-2xl rounded-bl-md text-left transition-all",
                        nowPikViewed 
                          ? "bg-secondary/50 border border-border/50" 
                          : "bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/40 hover:from-primary/30 hover:to-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          nowPikViewed ? "bg-muted" : "bg-primary/30"
                        )}>
                          {nowPikViewed ? (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Camera className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className={cn(
                            "text-sm font-medium",
                            nowPikViewed ? "text-muted-foreground" : "text-primary"
                          )}>
                            {nowPikViewed ? "NowPik visto" : "NowPik"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {nowPikViewed ? "Contenido expirado" : `Toca para ver • ${message.nowpik_duration}s`}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(message.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // Regular message rendering
          return (
            <div
              key={message.id}
              className={cn("flex", isOwn ? "justify-end" : "justify-start")}
            >
              <div className="flex flex-col max-w-[75%]">
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-2xl",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}
                >
                  <p className="break-words">
                    {showingTranslation && translation ? translation : message.content}
                  </p>
                  <div className={cn(
                    "flex items-center justify-end gap-1 mt-1",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    <span className="text-xs">
                      {new Date(message.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isOwn && (
                      <MessageReadReceipt 
                        sent={true} 
                        read={!!message.read} 
                        isPrime={isPrime} 
                      />
                    )}
                  </div>
                </div>
                
                {/* Translation controls for received messages */}
                {!isOwn && (
                  <div className="flex items-center gap-2 mt-1 ml-1">
                    {translation && (
                      <button
                        onClick={() => toggleShowTranslation(message.id)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Languages className="w-3 h-3" />
                        {showingTranslation ? "Ver original" : "Ver traducción"}
                      </button>
                    )}
                    {!translation && messageCanTranslate && (
                      <button
                        onClick={() => handleManualTranslate(message)}
                        disabled={isTranslating}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {isTranslating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Traduciendo...
                          </>
                        ) : (
                          <>
                            <Languages className="w-3 h-3" />
                            Traducir
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator - Prime only */}
        {isPrime && otherUserTyping && (
          <TypingIndicator userName={otherProfile?.display_name} />
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* Expired overlay - use new ChatTimePaywall for Free users, keep old for Prime */}
      {chatExpired && !isPrime && (
        <ChatTimePaywall
          timeRemaining={0}
          chatExpired={true}
          isPrime={isPrime}
          otherUserName={otherProfile?.display_name || "Usuario"}
          onReopen={handleReopenChat}
        />
      )}
      {chatExpired && isPrime && (
        <ChatExpiredOverlay
          otherUserName={otherProfile?.display_name || "Usuario"}
          isPrime={isPrime}
          otherIsPrime={otherProfile?.is_prime || false}
          onReopen={handleReopenChat}
        />
      )}

      {/* Input */}
      {!chatExpired && userId && matchId && (
        <footer className="sticky bottom-0 glass border-t p-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* NowPik button */}
            <NowPikSender
              matchId={matchId}
              userId={userId}
              onSend={handleSendNowPik}
              disabled={sending}
              isPrime={isPrime}
            />
            
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Broadcast typing state for Prime users
                if (isPrime && e.target.value.length > 0) {
                  setTyping(true);
                } else if (isPrime) {
                  setTyping(false);
                }
              }}
              onBlur={() => {
                // Stop typing indicator when input loses focus
                if (isPrime) {
                  setTyping(false);
                }
              }}
              placeholder="Escribe un mensaje..."
              className="flex-1 h-11"
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 gradient-primary"
              disabled={!newMessage.trim() || sending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </footer>
      )}

      {/* NowPik Viewer */}
      {viewingNowPik && (
        <NowPikViewer
          imageUrl={viewingNowPik.imageUrl}
          duration={viewingNowPik.duration}
          senderName={viewingNowPik.senderName}
          onClose={() => setViewingNowPik(null)}
          onViewed={handleNowPikViewed}
        />
      )}
    </div>
  );
};

export default Chat;
