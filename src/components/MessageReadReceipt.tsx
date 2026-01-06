import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageReadReceiptProps {
  sent: boolean;
  read: boolean;
  isPrime: boolean;
  className?: string;
}

const MessageReadReceipt = ({ sent, read, isPrime, className }: MessageReadReceiptProps) => {
  // Only show for Prime users
  if (!isPrime) return null;

  return (
    <span className={cn("inline-flex items-center ml-1", className)}>
      {read ? (
        <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/80" />
      ) : sent ? (
        <Check className="w-3.5 h-3.5 text-primary-foreground/50" />
      ) : null}
    </span>
  );
};

export default MessageReadReceipt;
