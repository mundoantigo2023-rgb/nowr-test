import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Users } from "lucide-react";

export type SearchPreference = "men" | "women" | "both";

interface SearchPreferenceStepProps {
  onSelect: (preference: SearchPreference) => void;
  initialValue?: SearchPreference | null;
}

const SearchPreferenceStep = ({ onSelect, initialValue }: SearchPreferenceStepProps) => {
  const [selected, setSelected] = useState<SearchPreference | null>(initialValue || null);

  const options: { id: SearchPreference; label: string; icon: React.ReactNode }[] = [
    { id: "men", label: "Hombres", icon: <User className="w-8 h-8" /> },
    { id: "women", label: "Mujeres", icon: <User className="w-8 h-8" /> },
    { id: "both", label: "Ambos", icon: <Users className="w-8 h-8" /> },
  ];

  const handleSelect = (preference: SearchPreference) => {
    setSelected(preference);
  };

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
        ¿Qué estás buscando ahora?
      </h1>
      <p className="text-muted-foreground text-center mb-10 max-w-xs">
        Esto define qué perfiles ves en NOWR.
      </p>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm mb-10">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200",
              selected === option.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/50 hover:bg-secondary/50"
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
              selected === option.id
                ? "bg-primary/20 text-primary"
                : "bg-muted/30 text-muted-foreground"
            )}>
              {option.icon}
            </div>
            <span className="text-lg font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selected}
        className="w-full max-w-sm h-14 text-base font-semibold gradient-primary glow"
      >
        Continuar
      </Button>
    </div>
  );
};

export default SearchPreferenceStep;
