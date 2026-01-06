import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Loader2, Users, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrivateAlbum } from "@/hooks/usePrivateAlbum";

interface Profile {
  user_id: string;
  display_name: string;
  photos: string[];
}

interface AlbumAccessManagerProps {
  currentUserId: string;
}

const AlbumAccessManager = ({ currentUserId }: AlbumAccessManagerProps) => {
  const { toast } = useToast();
  const { getPendingRequests, respondToRequest, accessRecords, loading, refetch } = usePrivateAlbum(currentUserId);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [responding, setResponding] = useState<string | null>(null);

  const pendingRequests = getPendingRequests();
  const grantedAccess = accessRecords.filter(
    r => r.owner_id === currentUserId && r.status === "granted"
  );

  useEffect(() => {
    const fetchProfiles = async () => {
      const userIds = [
        ...pendingRequests.map(r => r.requester_id),
        ...grantedAccess.map(r => r.requester_id)
      ];
      
      if (userIds.length === 0) return;

      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, photos")
        .in("user_id", userIds);

      if (data) {
        const profileMap: Record<string, Profile> = {};
        data.forEach(p => {
          profileMap[p.user_id] = p as Profile;
        });
        setProfiles(profileMap);
      }
    };

    fetchProfiles();
  }, [pendingRequests, grantedAccess]);

  const handleRespond = async (requesterId: string, grant: boolean) => {
    setResponding(requesterId);
    const success = await respondToRequest(requesterId, grant);
    setResponding(null);

    if (success) {
      toast({
        title: grant ? "Acceso concedido" : "Acceso denegado",
        description: grant 
          ? "El usuario ahora puede ver tu álbum privado" 
          : "La solicitud ha sido rechazada",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async (requesterId: string) => {
    setResponding(requesterId);
    const { error } = await supabase
      .from("album_access")
      .delete()
      .eq("owner_id", currentUserId)
      .eq("requester_id", requesterId);

    setResponding(null);

    if (!error) {
      refetch();
      toast({
        title: "Acceso revocado",
        description: "El usuario ya no puede ver tu álbum privado",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Solicitudes pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tienes solicitudes pendientes
            </p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => {
                const profile = profiles[request.requester_id];
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.photos?.[0]} />
                        <AvatarFallback>
                          {profile?.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {profile?.display_name || "Usuario"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitó acceso a tu álbum
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRespond(request.requester_id, false)}
                        disabled={responding === request.requester_id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {responding === request.requester_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRespond(request.requester_id, true)}
                        disabled={responding === request.requester_id}
                        className="gradient-primary"
                      >
                        {responding === request.requester_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users with access */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Usuarios con acceso ({grantedAccess.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {grantedAccess.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nadie tiene acceso a tu álbum privado
            </p>
          ) : (
            <div className="space-y-2">
              {grantedAccess.map((access) => {
                const profile = profiles[access.requester_id];
                return (
                  <div
                    key={access.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.photos?.[0]} />
                        <AvatarFallback>
                          {profile?.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-foreground">
                        {profile?.display_name || "Usuario"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(access.requester_id)}
                      disabled={responding === access.requester_id}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      {responding === access.requester_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Revocar"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlbumAccessManager;
