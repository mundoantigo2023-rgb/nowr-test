import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationsProvider } from "@/components/NotificationsProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CookieConsent from "@/components/CookieConsent";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import ForYou from "./pages/ForYou";
import ProfileView from "./pages/ProfileView";
import MatchScreen from "./pages/MatchScreen";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Prime from "./pages/Prime";
import MyProfile from "./pages/MyProfile";
import Favorites from "./pages/Favorites";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import Install from "./pages/Install";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Helper component to run global logic
import { useLocation } from "@/hooks/useLocation";
const GlobalLogic = () => {
  useLocation();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NotificationsProvider>
              <Routes>
                <Route path="/" element={<Splash />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/home" element={<Home />} />
                <Route path="/for-you" element={<ForYou />} />
                <Route path="/profile/:userId" element={<ProfileView />} />
                <Route path="/match" element={<MatchScreen />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/chat/:matchId" element={<Chat />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/prime" element={<Prime />} />
                <Route path="/my-profile" element={<MyProfile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/community-guidelines" element={<CommunityGuidelines />} />
                <Route path="/install" element={<Install />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              <GlobalLogic />
              <CookieConsent />
            </NotificationsProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
