import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AlbumAccess {
  id: string;
  owner_id: string;
  requester_id: string;
  status: "pending" | "granted" | "denied";
  requested_at: string;
  responded_at: string | null;
}

export const usePrivateAlbum = (currentUserId: string | undefined) => {
  const [accessRecords, setAccessRecords] = useState<AlbumAccess[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAccessRecords = useCallback(async () => {
    if (!currentUserId) return;
    
    const { data, error } = await supabase
      .from("album_access")
      .select("*")
      .or(`owner_id.eq.${currentUserId},requester_id.eq.${currentUserId}`);

    if (!error && data) {
      setAccessRecords(data as AlbumAccess[]);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchAccessRecords();
  }, [fetchAccessRecords]);

  const getAccessStatus = (ownerId: string): AlbumAccess | null => {
    return accessRecords.find(
      r => r.owner_id === ownerId && r.requester_id === currentUserId
    ) || null;
  };

  const hasAccess = (ownerId: string): boolean => {
    if (ownerId === currentUserId) return true;
    const record = getAccessStatus(ownerId);
    return record?.status === "granted";
  };

  const hasPendingRequest = (ownerId: string): boolean => {
    const record = getAccessStatus(ownerId);
    return record?.status === "pending";
  };

  const requestAccess = async (ownerId: string): Promise<boolean> => {
    if (!currentUserId || currentUserId === ownerId) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("album_access")
        .insert({
          owner_id: ownerId,
          requester_id: currentUserId,
          status: "pending"
        });

      if (error) {
        console.error("Error requesting access:", error);
        return false;
      }

      await fetchAccessRecords();
      return true;
    } catch (error) {
      console.error("Error requesting access:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (
    requesterId: string,
    grant: boolean
  ): Promise<boolean> => {
    if (!currentUserId) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("album_access")
        .update({
          status: grant ? "granted" : "denied",
          responded_at: new Date().toISOString()
        })
        .eq("owner_id", currentUserId)
        .eq("requester_id", requesterId);

      if (error) {
        console.error("Error responding to request:", error);
        return false;
      }

      await fetchAccessRecords();
      return true;
    } catch (error) {
      console.error("Error responding to request:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPendingRequests = (): AlbumAccess[] => {
    return accessRecords.filter(
      r => r.owner_id === currentUserId && r.status === "pending"
    );
  };

  const revokeAccess = async (requesterId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("album_access")
        .delete()
        .eq("owner_id", currentUserId)
        .eq("requester_id", requesterId);

      if (error) {
        console.error("Error revoking access:", error);
        return false;
      }

      await fetchAccessRecords();
      return true;
    } catch (error) {
      console.error("Error revoking access:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    accessRecords,
    loading,
    hasAccess,
    hasPendingRequest,
    getAccessStatus,
    requestAccess,
    respondToRequest,
    getPendingRequests,
    revokeAccess,
    refetch: fetchAccessRecords
  };
};
