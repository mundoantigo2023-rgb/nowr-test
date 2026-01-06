import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Event types for NOWR analytics - focused on real conversation activation
export type AnalyticsEvent =
  // Onboarding funnel
  | "onboarding_started"
  | "onboarding_step_viewed"
  | "onboarding_completed"
  | "onboarding_skipped"
  // Discovery & exploration
  | "discovery_viewed"
  | "discovery_profile_clicked"
  | "discovery_filter_applied"
  | "discovery_scrolled"
  | "discovery_refreshed"
  | "search_preference_changed"
  // Interest & matching
  | "interest_sent"
  | "interest_received"
  | "match_created"
  | "match_screen_viewed"
  | "match_chat_started"
  | "match_profile_viewed"
  | "match_deferred"
  // Chat & conversation (key activation metrics)
  | "chat_opened"
  | "chat_message_sent"
  | "chat_message_received"
  | "chat_nowpik_sent"
  | "chat_nowpik_viewed"
  | "chat_expired"
  | "chat_reopened"
  | "chat_extended"
  | "chat_retained"
  // Prime conversion
  | "prime_page_viewed"
  | "prime_feature_clicked"
  | "prime_upgrade_started"
  | "prime_upgrade_completed"
  // NowPick boost
  | "nowpick_activated"
  | "nowpick_expired"
  | "nowpick_profile_viewed"
  // Retention signals
  | "session_started"
  | "session_ended"
  | "daily_return"
  | "notification_clicked"
  | "notification_sent";

interface EventProperties {
  // Common
  userId?: string;
  timestamp?: string;
  sessionId?: string;
  // Location context
  city?: string;
  cityActivityLevel?: "low" | "medium" | "high";
  // Onboarding
  step?: number;
  stepName?: string;
  // Discovery
  filterType?: string;
  profileCount?: number;
  scrollDepth?: number;
  // Match
  matchId?: string;
  otherUserId?: string;
  matchType?: "mutual" | "nowpick";
  // Chat
  messageCount?: number;
  conversationDuration?: number;
  isFirstMessage?: boolean;
  expiresIn?: number;
  // Prime
  feature?: string;
  source?: string;
  // Custom
  [key: string]: string | number | boolean | undefined;
}

// In-memory event queue for batching
let eventQueue: Array<{ event: AnalyticsEvent; properties: EventProperties; timestamp: string }> = [];
let flushTimeout: NodeJS.Timeout | null = null;

// Generate unique session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("nowr_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("nowr_session_id", sessionId);
  }
  return sessionId;
};

export function useAnalytics() {
  // Track a single event
  const track = useCallback((event: AnalyticsEvent, properties: EventProperties = {}) => {
    const enrichedProperties: EventProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
    };

    // Add to queue
    eventQueue.push({
      event,
      properties: enrichedProperties,
      timestamp: enrichedProperties.timestamp!,
    });

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${event}`, enrichedProperties);
    }

    // Debounced flush - send events in batches
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(() => flushEvents(), 2000);
  }, []);

  // Track page view with context
  const trackPageView = useCallback((pageName: string, properties: EventProperties = {}) => {
    track(`${pageName}_viewed` as AnalyticsEvent, {
      ...properties,
      page: pageName,
    });
  }, [track]);

  // Track conversion funnel step
  const trackFunnelStep = useCallback((funnel: string, step: number, stepName: string, properties: EventProperties = {}) => {
    track(`${funnel}_step_viewed` as AnalyticsEvent, {
      ...properties,
      funnel,
      step,
      stepName,
    });
  }, [track]);

  // Track user action with timing
  const trackAction = useCallback((action: AnalyticsEvent, startTime?: number, properties: EventProperties = {}) => {
    const duration = startTime ? Date.now() - startTime : undefined;
    track(action, {
      ...properties,
      duration,
    });
  }, [track]);

  // Key activation metric: conversation started
  const trackConversationActivation = useCallback((matchId: string, otherUserId: string, isFirstMessage: boolean) => {
    track("chat_message_sent", {
      matchId,
      otherUserId,
      isFirstMessage,
      activationType: isFirstMessage ? "initiated" : "continued",
    });
  }, [track]);

  // Track Prime interest with source
  const trackPrimeInterest = useCallback((feature: string, source: string) => {
    track("prime_feature_clicked", {
      feature,
      source,
    });
  }, [track]);

  return {
    track,
    trackPageView,
    trackFunnelStep,
    trackAction,
    trackConversationActivation,
    trackPrimeInterest,
  };
}

// Flush events to backend
async function flushEvents() {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Store events in analytics_events table
    const eventsToInsert = events.map(e => ({
      user_id: user?.id || null,
      event_type: e.event,
      event_data: e.properties,
      session_id: e.properties.sessionId || null,
      created_at: e.timestamp,
    }));

    const { error } = await supabase
      .from('analytics_events')
      .insert(eventsToInsert);

    if (error) {
      throw error;
    }

    if (import.meta.env.DEV) {
      console.log(`[Analytics] Flushed ${events.length} events to database`);
    }
  } catch (error) {
    // Re-queue on failure
    eventQueue = [...events, ...eventQueue];
    console.error("[Analytics] Failed to flush events:", error);
  }
}

// Export for direct usage
export { getSessionId };
