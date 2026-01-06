import { useState, useEffect, useCallback } from "react";

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem("chat_notifications_enabled");
    return saved !== null ? saved === "true" : true; // Default to enabled
  });

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("chat_notifications_enabled", String(notificationsEnabled));
  }, [notificationsEnabled]);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        setNotificationsEnabled(true);
      }
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, []);

  const toggleNotifications = useCallback(() => {
    if (permission !== "granted") {
      // If not granted, try to request permission first
      requestPermission();
      return;
    }
    setNotificationsEnabled(prev => !prev);
  }, [permission, requestPermission]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!("Notification" in window)) return null;
      if (permission !== "granted") return null;
      if (!notificationsEnabled) return null; // Respect user's toggle preference
      if (document.hasFocus()) return null; // Don't notify if tab is focused

      try {
        const notification = new Notification(title, {
          icon: "/favicon.png",
          badge: "/favicon.png",
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
    [permission, notificationsEnabled]
  );

  return {
    permission,
    isSupported: "Notification" in window,
    notificationsEnabled,
    requestPermission,
    toggleNotifications,
    sendNotification,
  };
};
