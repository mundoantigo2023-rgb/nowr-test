import { useNavigate, useLocation } from "react-router-dom";
import { Compass, Sparkles, MessageCircle, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  isPrime?: boolean;
  badge?: number;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, isActive, isPrime, badge, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 relative",
      isPrime && !isActive && "text-prime",
      isActive 
        ? isPrime ? "text-prime" : "text-primary"
        : !isPrime && "text-muted-foreground hover:text-foreground"
    )}
  >
    <div className="relative">
      <Icon className={cn("w-5 h-5", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
    <span className="text-[9px] font-medium">{label}</span>
  </button>
);

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnreadMessages();
  const { t } = useLanguage();

  const navItems = [
    { icon: Compass, label: t("explore"), path: "/home" },
    { icon: Sparkles, label: t("forYou"), path: "/for-you" },
    { icon: MessageCircle, label: t("messages"), path: "/matches", badge: unreadCount },
    { icon: Crown, label: t("prime"), path: "/prime", isPrime: true },
    { icon: User, label: t("profile"), path: "/my-profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
            isPrime={item.isPrime}
            badge={item.badge}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;