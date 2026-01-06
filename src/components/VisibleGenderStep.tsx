import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export type VisibleGender = "man" | "woman";

interface VisibleGenderStepProps {
  onSelect: (gender: VisibleGender) => void;
  initialValue?: VisibleGender | null;
}

const VisibleGenderStep = ({ onSelect, initialValue }: VisibleGenderStepProps) => {
  const [selected, setSelected] = useState<VisibleGender | null>(initialValue || null);

  const options: { id: VisibleGender; label: string }[] = [
    { id: "man", label: "Hombre" },
    { id: "woman", label: "Mujer" },
  ];

  const handleSelect = (gender: VisibleGender) => {
    setSelected(gender);
  };

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
        ¿Cómo te muestras?
      </h1>
      <p className="text-muted-foreground text-center mb-10 max-w-xs">
        Esto define quién puede encontrarte.
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200",
              selected === option.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/50 hover:bg-secondary/50"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
              selected === option.id
                ? "bg-primary/20 text-primary"
                : "bg-muted/30 text-muted-foreground"
            )}>
              <User className="w-8 h-8" />
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

export default VisibleGenderStep;
