import { Button } from "@/components/ui/button";
import { Crown, Users, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchRetentionBannerProps {
  matchesCount: number;
  expiringCount: number;
  isPrime: boolean;
}

const MatchRetentionBanner = ({ 
  matchesCount, 
  expiringCount, 
  isPrime 
}: MatchRetentionBannerProps) => {
  const navigate = useNavigate();

  if (isPrime || expiringCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-prime/10 to-primary/10 border border-prime/20 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-prime/20">
          <RefreshCw className="w-5 h-5 text-prime" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-sm">
            {expiringCount === 1 
              ? "1 conversación por expirar"
              : `${expiringCount} conversaciones por expirar`}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Con Prime, tus conversaciones no tienen límite de tiempo.
          </p>
        </div>
      </div>
      <Button
        onClick={() => navigate("/prime")}
        size="sm"
        className="w-full mt-3 bg-prime/20 text-prime hover:bg-prime/30 border border-prime/30"
      >
        <Crown className="w-4 h-4 mr-2" />
        Tiempo ilimitado con Prime
      </Button>
    </div>
  );
};

export default MatchRetentionBanner;
