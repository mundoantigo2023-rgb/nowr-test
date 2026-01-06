import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RetentionNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  cta_text: string;
  cta_path: string;
  sent_at: string;
  read_at: string | null;
}

export const useRetentionNotifications = (userId: string | null) => {
  const [notifications, setNotifications] = useState<RetentionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("retention_notifications")
        .select("*")
        .eq("user_id", userId)
        .is("read_at", null)
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching retention notifications:", error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.length || 0);
    } catch (err) {
      console.error("Error in fetchNotifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("retention_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error in markAsRead:", err);
    }
  }, [userId]);

  // Dismiss all notifications
  const dismissAll = useCallback(async () => {
    if (!userId || notifications.length === 0) return;

    try {
      const ids = notifications.map(n => n.id);
      const { error } = await supabase
        .from("retention_notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids)
        .eq("user_id", userId);

      if (error) {
        console.error("Error dismissing notifications:", error);
        return;
      }

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error in dismissAll:", err);
    }
  }, [userId, notifications]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Listen for new notifications
    const channel = supabase
      .channel(`retention-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "retention_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as RetentionNotification;
          if (newNotification.sent_at && !newNotification.read_at) {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    dismissAll,
    refetch: fetchNotifications,
  };
};
