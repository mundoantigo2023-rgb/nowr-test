import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import BottomNav from "@/components/BottomNav";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NowrLogoLoader } from "@/components/NowrLogo";

const Favorites = () => {
  const navigate = useNavigate();
  const [loading] = useState(false);

  // Placeholder - will be connected to saved profiles later
  const favorites: any[] = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Favoritos</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Sin favoritos aún</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Guarda perfiles que te interesen para verlos aquí más tarde
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Favorite cards will go here */}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Favorites;
