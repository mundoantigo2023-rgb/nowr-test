import { useNavigate } from "react-router-dom";
import { Eye, Crown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Visitor {
  id: string;
  viewer_id: string;
  viewed_at: string;
  viewer_profile?: {
    display_name: string;
    photos: string[] | null;
    online_status: boolean | null;
    is_prime: boolean | null;
  };
}

interface ProfileVisitorsProps {
  visitors: Visitor[];
  loading: boolean;
  className?: string;
}

const ProfileVisitors = ({ visitors, loading, className }: ProfileVisitorsProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-prime" />
          <h3 className="text-sm font-medium">Visitantes recientes</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-16 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-muted mx-auto" />
              <div className="h-3 bg-muted rounded mt-2 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visitors.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-prime" />
          <h3 className="text-sm font-medium">Visitantes recientes</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Aún no tienes visitantes recientes
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-prime" />
        <h3 className="text-sm font-medium">Visitantes recientes</h3>
        <span className="text-xs text-muted-foreground">({visitors.length})</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {visitors.map((visitor) => {
          const photo = visitor.viewer_profile?.photos?.[0] || 
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${visitor.viewer_id}`;
          const isRecent = new Date(visitor.viewed_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          return (
            <button
              key={visitor.id}
              onClick={() => navigate(`/profile/${visitor.viewer_id}`)}
              className="flex-shrink-0 w-16 text-center group"
            >
              <div className="relative mx-auto w-14 h-14">
                <img
                  src={photo}
                  alt={visitor.viewer_profile?.display_name || "Visitante"}
                  className={cn(
                    "w-14 h-14 rounded-full object-cover border-2 transition-transform group-hover:scale-105",
                    isRecent ? "border-prime" : "border-border"
                  )}
                />
                {visitor.viewer_profile?.online_status && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-background" />
                )}
                {visitor.viewer_profile?.is_prime && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-prime rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-prime-foreground" />
                  </span>
                )}
                {isRecent && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
                  </span>
                )}
              </div>
              <p className="text-xs font-medium mt-1.5 truncate">
                {visitor.viewer_profile?.display_name || "Usuario"}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {formatDistanceToNow(new Date(visitor.viewed_at), { 
                  addSuffix: false, 
                  locale: es 
                })}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileVisitors;
