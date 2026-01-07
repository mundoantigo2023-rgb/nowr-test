import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, Crown, Lock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useInteractionDelay } from "@/hooks/useInteractionDelay";
import { INTEREST_OPTIONS, PRESENCE_OPTIONS } from "@/lib/profileOptions";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface FilterState {
  ageRange: [number, number];
  distance: number;
  presence: "all" | "now" | "today";
  interests: string[];
}

type SearchPreference = "men" | "women" | "both";

interface FilterDrawerProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isPrime?: boolean;
  searchPreference?: SearchPreference | null;
  onSearchPreferenceChange?: (pref: SearchPreference) => void;
}

const FilterDrawer = ({
  filters,
  onFiltersChange,
  isPrime = false,
  searchPreference,
  onSearchPreferenceChange
}: FilterDrawerProps) => {
  // Filters are controlled by parent now, but we use local state for the form
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Sync local filters when drawer opens or props change
  // This ensures if we reset from outside, it reflects here
  // useEffect(() => {
  //   setLocalFilters(filters);
  // }, [filters, open]);

  // Prevent carry-over clicks
  const interactionEnabled = useInteractionDelay(open, 350);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      ageRange: [18, 99],
      distance: 50,
      presence: "all",
      interests: [],
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters); // Apply immediately on reset
  };

  const toggleInterest = (id: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] bg-card border-l border-border/50">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">{t("filter")}</SheetTitle>
            <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-primary">
              {t("reset")}
            </button>
          </div>
        </SheetHeader>

        <div className="space-y-6 relative">


          {/* Prime Lock Overlay for non-Prime users */}
          {!isPrime && (
            <div className="absolute inset-0 top-24 z-10 bg-card/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 p-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-prime/20 to-prime-glow/20 flex items-center justify-center border border-prime/30">
                <Lock className="w-7 h-7 text-prime" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{t("primeFeatures")}</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  {t("primeOnly")}
                </p>
              </div>
              <Button
                onClick={() => {
                  setOpen(false);
                  navigate("/prime");
                }}
                className="bg-gradient-to-r from-prime to-prime-glow text-prime-foreground hover:opacity-90 gap-2"
              >
                <Crown className="w-4 h-4" />
                {t("goPrime")}
              </Button>
            </div>
          )}

          {/* Age Range */}
          <div className={cn("space-y-3", !isPrime && "opacity-40 pointer-events-none")}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{t("ageRange")}</span>
              <span className="text-sm text-muted-foreground">
                {localFilters.ageRange[0]} - {localFilters.ageRange[1]}
              </span>
            </div>
            <Slider
              value={localFilters.ageRange}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, ageRange: value as [number, number] }))
              }
              min={18}
              max={99}
              step={1}
              className="w-full"
              disabled={!isPrime}
            />
          </div>

          {/* Distance */}
          <div className={cn("space-y-3", !isPrime && "opacity-40 pointer-events-none")}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{t("maxDistance")}</span>
              <span className="text-sm text-muted-foreground">
                {localFilters.distance} km
              </span>
            </div>
            <Slider
              value={[localFilters.distance]}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, distance: value[0] }))
              }
              min={1}
              max={100}
              step={1}
              className="w-full"
              disabled={!isPrime}
            />
          </div>

          {/* Presence */}
          <div className={cn("space-y-3", !isPrime && "opacity-40 pointer-events-none")}>
            <span className="text-sm font-medium text-foreground">{t("availability")}</span>
            <div className="flex gap-2">
              {PRESENCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() =>
                    isPrime && setLocalFilters((prev) => ({ ...prev, presence: option.id }))
                  }
                  disabled={!isPrime}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    localFilters.presence === option.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className={cn("space-y-3", !isPrime && "opacity-40 pointer-events-none")}>
            <span className="text-sm font-medium text-foreground">{t("interests")}</span>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => isPrime && toggleInterest(option.id)}
                  disabled={!isPrime}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-all border",
                    localFilters.interests.includes(option.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Button - only show for Prime users */}
        {isPrime && (
          <div className={cn("absolute bottom-6 left-4 right-4", !interactionEnabled && "pointer-events-none")}>
            <Button onClick={handleApply} disabled={!interactionEnabled} className="w-full h-12">
              {t("apply")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;