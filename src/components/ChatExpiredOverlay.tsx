import { Button } from "@/components/ui/button";
import { Clock, Crown, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface ChatExpiredOverlayProps {
  otherUserName: string;
  onReconnect?: () => void;
  isPrime?: boolean;
  otherIsPrime?: boolean;
  onReopen?: () => Promise<void>;
}

const ChatExpiredOverlay = ({ 
  otherUserName, 
  onReconnect, 
  isPrime, 
  otherIsPrime,
  onReopen 
}: ChatExpiredOverlayProps) => {
  const navigate = useNavigate();
  const [reopening, setReopening] = useState(false);

  const handleReopen = async () => {
    if (!onReopen) return;
    setReopening(true);
    try {
      await onReopen();
    } finally {
      setReopening(false);
    }
  };

  // Determine what message to show based on user status
  const getMessage = () => {
    if (isPrime && otherIsPrime) {
      // Both Prime - shouldn't really get here, but just in case
      return "Como usuarios Prime, pueden chatear sin límite de tiempo.";
    } else if (isPrime) {
      // I'm Prime, other is Free
      return `El tiempo de esta conexión ha terminado. Como usuario Prime, puedes reactivar el chat por 60 minutos más.`;
    } else if (otherIsPrime) {
      // I'm Free, other is Prime
      return `El tiempo de esta conexión ha terminado. ${otherUserName} puede reactivar el chat si lo desea.`;
    } else {
      // Both Free
      return `El tiempo de esta conexión ha terminado. Si ambos desean continuar, pueden reconectar desde explorar.`;
    }
  };

  // Determine button text for Prime users
  const getReopenButtonText = () => {
    if (otherIsPrime) {
      return "Reabrir chat ilimitado";
    }
    return "Reactivar chat (60 min)";
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-muted-foreground" />
        </div>

        {/* Message */}
        <h2 className="font-display text-2xl font-bold text-foreground mb-3">
          Conversación finalizada
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          {getMessage()}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {isPrime && onReopen ? (
            <Button
              onClick={handleReopen}
              disabled={reopening}
              className="w-full h-14 text-base font-semibold bg-prime text-black hover:bg-prime/90"
            >
              {reopening ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 mr-2" />
              )}
              {reopening ? "Reabriendo..." : getReopenButtonText()}
            </Button>
          ) : !isPrime && !otherIsPrime ? (
            // Both Free - show Prime upsell
            <Button
              onClick={() => navigate("/prime")}
              className="w-full h-14 text-base font-semibold bg-prime text-black hover:bg-prime/90"
            >
              <Crown className="w-5 h-5 mr-2" />
              Prime: Tiempo ilimitado
            </Button>
          ) : (
            // Free user waiting for Prime to reopen
            <div className="py-4 text-center text-muted-foreground text-sm">
              Esperando a que {otherUserName} reactive el chat...
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => navigate("/home")}
            className="w-full h-12 text-base border-border/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Explorar más perfiles
          </Button>

          {/* Prime upsell for Free users chatting with Prime */}
          {!isPrime && otherIsPrime && (
            <Button
              variant="ghost"
              onClick={() => navigate("/prime")}
              className="w-full text-prime hover:text-prime/80"
            >
              <Crown className="w-4 h-4 mr-2" />
              Hazte Prime y reactiva chats tú también
            </Button>
          )}
        </div>

        {/* Subtle note */}
        <p className="text-xs text-muted-foreground/60 mt-6">
          Tus mensajes permanecen privados y seguros.
        </p>
      </div>
    </div>
  );
};

export default ChatExpiredOverlay;