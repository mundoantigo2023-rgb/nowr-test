import { cn } from "@/lib/utils";
import { User, Users, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterChip {
  id: string;
  label: string;
  active: boolean;
}

type SearchPreference = "men" | "women" | "both";

interface FilterChipsProps {
  chips: FilterChip[];
  onToggle: (id: string) => void;
  searchPreference?: SearchPreference | null;
  onSearchPreferenceChange?: (pref: SearchPreference) => void;
}

const FilterChips = ({ 
  chips, 
  onToggle, 
  searchPreference, 
  onSearchPreferenceChange 
}: FilterChipsProps) => {
  const { t } = useLanguage();
  
  const preferenceLabels: Record<SearchPreference, string> = {
    men: t("men"),
    women: t("women"),
    both: t("both"),
  };

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
      {/* Search Preference Dropdown Chip */}
      {searchPreference && onSearchPreferenceChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
              )}
            >
              {searchPreference === "both" ? (
                <Users className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              {preferenceLabels[searchPreference]}
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-card border-border/50">
            <DropdownMenuItem 
              onClick={() => onSearchPreferenceChange("men")}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                searchPreference === "men" && "bg-primary/10 text-primary"
              )}
            >
              <User className="w-4 h-4" />
              {t("men")}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onSearchPreferenceChange("women")}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                searchPreference === "women" && "bg-primary/10 text-primary"
              )}
            >
              <User className="w-4 h-4" />
              {t("women")}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onSearchPreferenceChange("both")}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                searchPreference === "both" && "bg-primary/10 text-primary"
              )}
            >
              <Users className="w-4 h-4" />
              {t("both")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Other filter chips */}
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onToggle(chip.id)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
            "border",
            chip.active
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
};

export default FilterChips;
