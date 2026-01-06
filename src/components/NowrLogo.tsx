import { cn } from "@/lib/utils";

interface NowrLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
}

const sizeMap = {
  sm: { width: 100, height: 32 },
  md: { width: 140, height: 44 },
  lg: { width: 180, height: 56 },
  xl: { width: 220, height: 68 },
};

export const NowrLogo = ({ className, size = "md", showText = true, animated = false }: NowrLogoProps) => {
  const { width, height } = sizeMap[size];
  const uniqueId = animated ? "animated" : "static";
  
  // When showText is false, use a square viewBox for better centering
  const iconOnlyWidth = showText ? width : height;
  const viewBox = showText ? "0 0 220 68" : "0 0 60 48";
  
  return (
    <svg
      viewBox={viewBox}
      width={showText ? width : iconOnlyWidth}
      height={height}
      className={cn("", className)}
      aria-label="NOWR Logo"
    >
      <defs>
        {/* Primary violet gradient */}
        <linearGradient id={`nowr-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(270, 80%, 66%)">
            {animated && (
              <animate
                attributeName="stop-color"
                values="hsl(270, 80%, 66%); hsl(280, 85%, 72%); hsl(270, 80%, 66%)"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </stop>
          <stop offset="100%" stopColor="hsl(280, 70%, 55%)">
            {animated && (
              <animate
                attributeName="stop-color"
                values="hsl(280, 70%, 55%); hsl(270, 80%, 66%); hsl(280, 70%, 55%)"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </stop>
        </linearGradient>
        
        {/* Secondary gradient for second shape */}
        <linearGradient id={`nowr-gradient-2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(280, 75%, 60%)">
            {animated && (
              <animate
                attributeName="stop-color"
                values="hsl(280, 75%, 60%); hsl(270, 80%, 68%); hsl(280, 75%, 60%)"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </stop>
          <stop offset="100%" stopColor="hsl(265, 70%, 52%)">
            {animated && (
              <animate
                attributeName="stop-color"
                values="hsl(265, 70%, 52%); hsl(275, 75%, 58%); hsl(265, 70%, 52%)"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </stop>
        </linearGradient>

        {/* Glow filter */}
        <filter id={`nowr-glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={animated ? "2" : "1.5"} result="coloredBlur">
            {animated && (
              <animate
                attributeName="stdDeviation"
                values="1.5;2.5;1.5"
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Connection point glow */}
        <filter id={`connection-glow-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur">
            {animated && (
              <animate
                attributeName="stdDeviation"
                values="2;4;2"
                dur="0.9s"
                repeatCount="indefinite"
              />
            )}
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Icon - Two abstract shapes approaching/connecting */}
      <g transform={showText ? "translate(8, 10)" : "translate(4, 0)"}>
        {/* Left shape - approaching from left */}
        <g>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 2,0; 0,0"
              dur="1.2s"
              repeatCount="indefinite"
            />
          )}
          <path
            d="M8 24 C8 12, 20 8, 28 14 L24 24 L28 34 C20 40, 8 36, 8 24Z"
            fill={`url(#nowr-gradient-${uniqueId})`}
            filter={`url(#nowr-glow-${uniqueId})`}
          >
            {animated && (
              <animate
                attributeName="opacity"
                values="1;0.85;1"
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </g>
        
        {/* Right shape - approaching from right */}
        <g>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -2,0; 0,0"
              dur="1.2s"
              repeatCount="indefinite"
            />
          )}
          <path
            d="M44 24 C44 12, 32 8, 24 14 L28 24 L24 34 C32 40, 44 36, 44 24Z"
            fill={`url(#nowr-gradient-2-${uniqueId})`}
            filter={`url(#nowr-glow-${uniqueId})`}
          >
            {animated && (
              <animate
                attributeName="opacity"
                values="1;0.85;1"
                dur="1s"
                repeatCount="indefinite"
                begin="0.1s"
              />
            )}
          </path>
        </g>
        
        {/* Connection point - the moment of encounter */}
        <circle
          cx="26"
          cy="24"
          r="3"
          fill="hsl(0, 0%, 98%)"
          filter={`url(#connection-glow-${uniqueId})`}
        >
          {animated && (
            <>
              <animate
                attributeName="r"
                values="2.5;4.5;2.5"
                dur="0.9s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </>
          )}
        </circle>
      </g>
      
      {/* Text - NOWR */}
      {showText && (
        <text
          x="68"
          y="46"
          fontFamily="Inter, sans-serif"
          fontSize="30"
          fontWeight="700"
          letterSpacing="0.14em"
          fill="hsl(0, 0%, 96%)"
        >
          {animated && (
            <animate
              attributeName="opacity"
              values="1;0.9;1"
              dur="1.2s"
              repeatCount="indefinite"
            />
          )}
          NOWR
        </text>
      )}
    </svg>
  );
};

// Animated icon-only version for loading states
export const NowrLogoLoader = ({ className, size = "lg" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) => {
  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <NowrLogo size={size} animated showText={false} />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              animation: `nowr-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes nowr-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// Icon-only version for smaller spaces
export const NowrIcon = ({ className, size = 32, animated = false }: { className?: string; size?: number; animated?: boolean }) => {
  const uniqueId = animated ? "icon-animated" : "icon-static";
  
  return (
    <svg
      viewBox="0 0 52 48"
      width={size}
      height={size * 0.92}
      className={cn("", className)}
      aria-label="NOWR"
    >
      <defs>
        <linearGradient id={`nowr-icon-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(270, 80%, 66%)">
            {animated && (
              <animate
                attributeName="stop-color"
                values="hsl(270, 80%, 66%); hsl(280, 85%, 72%); hsl(270, 80%, 66%)"
                dur="3s"
                repeatCount="indefinite"
              />
            )}
          </stop>
          <stop offset="100%" stopColor="hsl(280, 70%, 55%)">
            {animated && (
              <animate
                attributeName="stop-color"
                values="hsl(280, 70%, 55%); hsl(270, 80%, 66%); hsl(280, 70%, 55%)"
                dur="3s"
                repeatCount="indefinite"
              />
            )}
          </stop>
        </linearGradient>
        
        <linearGradient id={`nowr-icon-gradient-2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(280, 75%, 60%)" />
          <stop offset="100%" stopColor="hsl(265, 70%, 52%)" />
        </linearGradient>
        
        <filter id={`nowr-icon-glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur">
            {animated && (
              <animate
                attributeName="stdDeviation"
                values="1;2.5;1"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id={`nowr-icon-center-glow-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur">
            {animated && (
              <animate
                attributeName="stdDeviation"
                values="1.5;3;1.5"
                dur="1.8s"
                repeatCount="indefinite"
              />
            )}
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <g>
        {/* Left shape */}
        <g>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 1,0; 0,0"
              dur="2.5s"
              repeatCount="indefinite"
            />
          )}
          <path
            d="M8 24 C8 12, 20 8, 28 14 L24 24 L28 34 C20 40, 8 36, 8 24Z"
            fill={`url(#nowr-icon-gradient-${uniqueId})`}
            filter={`url(#nowr-icon-glow-${uniqueId})`}
          >
            {animated && (
              <animate
                attributeName="opacity"
                values="1;0.75;1"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </g>
        
        {/* Right shape */}
        <g>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -1,0; 0,0"
              dur="2.5s"
              repeatCount="indefinite"
            />
          )}
          <path
            d="M44 24 C44 12, 32 8, 24 14 L28 24 L24 34 C32 40, 44 36, 44 24Z"
            fill={`url(#nowr-icon-gradient-2-${uniqueId})`}
            filter={`url(#nowr-icon-glow-${uniqueId})`}
          >
            {animated && (
              <animate
                attributeName="opacity"
                values="1;0.75;1"
                dur="2s"
                repeatCount="indefinite"
                begin="0.2s"
              />
            )}
          </path>
        </g>
        
        {/* Connection point */}
        <circle
          cx="26"
          cy="24"
          r="3"
          fill="hsl(0, 0%, 98%)"
          filter={`url(#nowr-icon-center-glow-${uniqueId})`}
        >
          {animated && (
            <>
              <animate
                attributeName="r"
                values="2.5;4;2.5"
                dur="1.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </>
          )}
        </circle>
      </g>
    </svg>
  );
};

export default NowrLogo;
