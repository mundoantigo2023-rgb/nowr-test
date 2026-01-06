import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

const TypingIndicator = ({ userName, className }: TypingIndicatorProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 px-3 py-2 bg-secondary/50 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "0.6s" }}
          />
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: "150ms", animationDuration: "0.6s" }}
          />
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: "300ms", animationDuration: "0.6s" }}
          />
        </div>
      </div>
      {userName && (
        <span className="text-xs text-muted-foreground">
          {userName} está escribiendo...
        </span>
      )}
    </div>
  );
};

export default TypingIndicator;
