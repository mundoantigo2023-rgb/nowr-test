import { cn } from "@/lib/utils";
import { NowrLogo } from "@/components/NowrLogo";

interface NowrBrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animated?: boolean;
}

const NowrBrandLogo = ({ size = "md", className, animated = false }: NowrBrandLogoProps) => {
  return (
    <div className={cn("", className)}>
      <NowrLogo size={size} animated={animated} />
    </div>
  );
};

export default NowrBrandLogo;
