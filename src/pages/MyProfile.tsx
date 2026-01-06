import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, Crown, Settings, LogOut, Eye, EyeOff, MapPin, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useProfileVisitors } from "@/hooks/useProfileVisitors";
import { NowrLogoLoader } from "@/components/NowrLogo";
import BottomNav from "@/components/BottomNav";
import PrivateAlbumManager from "@/components/PrivateAlbumManager";
import NowPickBoost from "@/components/NowPickBoost";
import ProfilePhotoManager from "@/components/ProfilePhotoManager";
import ProfileVisitors from "@/components/ProfileVisitors";
import { AVAILABILITY_OPTIONS, INTEREST_OPTIONS } from "@/lib/profileOptions";
import { useLanguage } from "@/contexts/LanguageContext";

interface Profile {
  display_name: string;
  short_description: string | null;
  photos: string[];
  intention_tags: string[];
  city: string | null;
  is_prime: boolean | null;
  invisible_mode: boolean | null;
  private_photos: string[] | null;
  nowpick_active_until: string | null;
  nowpick_last_used: string | null;
  search_preference: string | null;
  show_age: boolean | null;
}

type SearchPreference = "men" | "women" | "both";
type VisibleGender = "man" | "woman";

const MyProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [availability, setAvailability] = useState("solo_explorando");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [invisibleMode, setInvisibleMode] = useState(false);
  const [showAge, setShowAge] = useState(true);
  const [privatePhotos, setPrivatePhotos] = useState<string[]>([]);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isPrime, setIsPrime] = useState(false);
  const [searchPreference, setSearchPreference] = useState<SearchPreference | null>(null);
  const [visibleGender, setVisibleGender] = useState<VisibleGender | null>(null);

  // Profile visitors hook - Prime only
  const { visitors, loading: visitorsLoading, unreadCount } = useProfileVisitors(user?.id, isPrime);

  // Original values to track changes
  const [originalValues, setOriginalValues] = useState<{
    displayName: string;
    description: string;
    availability: string;
    lookingFor: string[];
    invisibleMode: boolean;
    showAge: boolean;
  } | null>(null);

  // Check if there are unsaved changes
  const hasChanges = originalValues !== null && (
    displayName !== originalValues.displayName ||
    description !== originalValues.description ||
    availability !== originalValues.availability ||
    JSON.stringify(lookingFor.sort()) !== JSON.stringify(originalValues.lookingFor.sort()) ||
    invisibleMode !== originalValues.invisibleMode ||
    showAge !== originalValues.showAge
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      detectLocation();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, short_description, photos, intention_tags, city, is_prime, invisible_mode, private_photos, nowpick_active_until, nowpick_last_used, search_preference, visible_gender, show_age")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setDisplayName(data.display_name || "");
      setDescription(data.short_description || "");
      setPhotos(data.photos || []);
      setInvisibleMode(data.invisible_mode || false);
      setShowAge(data.show_age !== false); // Default true if null/undefined
      setPrivatePhotos(data.private_photos || []);
      setDetectedCity(data.city || null);
      setIsPrime(data.is_prime || false);
      setSearchPreference(data.search_preference as SearchPreference || null);
      setVisibleGender(data.visible_gender as VisibleGender || null);

      // Parse intention tags
      const tags = data.intention_tags || [];
      const availabilityTag = tags.find((t: string) =>
        AVAILABILITY_OPTIONS.some(opt => opt.id === t)
      );
      const parsedAvailability = availabilityTag || "solo_explorando";
      setAvailability(parsedAvailability);

      const interestTags = tags.filter((t: string) =>
        INTEREST_OPTIONS.some(opt => opt.id === t)
      );
      setLookingFor(interestTags);

      // Store original values to track changes
      setOriginalValues({
        displayName: data.display_name || "",
        description: data.short_description || "",
        availability: parsedAvailability,
        lookingFor: interestTags,
        invisibleMode: data.invisible_mode || false,
        showAge: data.show_age !== false,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    if (!user || !navigator.geolocation) return;

    setDetectingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocoding using OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
          },
        }
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();
      const city = data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        data.address?.county ||
        null;

      if (city) {
        setDetectedCity(city);

        // Update profile with location
        await supabase
          .from("profiles")
          .update({
            city: city,
            latitude: latitude,
            longitude: longitude,
          })
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.log("Location detection skipped:", error);
      // Silent fail - location is optional
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const intentionTags = [availability, ...lookingFor];

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          short_description: description,
          intention_tags: intentionTags,
          invisible_mode: invisibleMode,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: t("profileUpdated"),
        description: t("changesSaved"),
      });

      // Update original values after successful save
      setOriginalValues({
        displayName,
        description,
        availability,
        lookingFor,
        invisibleMode,
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: t("error"),
        description: t("somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleLookingFor = (value: string) => {
    setLookingFor(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NowrLogoLoader size="lg" />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{t("yourProfile")}</h1>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving} size="sm" className="animate-fade-in">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {t("save")}
                  </>
                )}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Visitors - Prime only */}
        {isPrime && (
          <Card className="border-prime/30 bg-prime/5">
            <CardContent className="p-4">
              <ProfileVisitors
                visitors={visitors}
                loading={visitorsLoading}
              />
            </CardContent>
          </Card>
        )}

        {/* Photos Manager */}
        {user && (
          <ProfilePhotoManager
            userId={user.id}
            photos={photos}
            isPrime={profile?.is_prime || false}
            onPhotosChange={setPhotos}
          />
        )}

        {/* Info */}
        <Card className="border-border/30">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t("name")}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("yourNamePlaceholder")}
                maxLength={30}
                className="bg-secondary border-border/50"
              />
            </div>

            {/* Auto-detected location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {t("location")}
              </Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 border border-border/30">
                {detectingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("detectingLocation")}</span>
                  </>
                ) : detectedCity ? (
                  <>
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{detectedCity}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("locationNotAvailable")}</span>
                    <button
                      onClick={detectLocation}
                      className="ml-auto text-xs text-primary hover:underline"
                    >
                      {t("detect")}
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("locationAutoDetect")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("shortBio")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("bioPlaceholder")}
                maxLength={120}
                rows={2}
                className="bg-secondary border-border/50"
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/120
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Availability Status */}
        <Card className="border-border/30">
          <CardContent className="p-6 space-y-4">
            <Label className="text-foreground">{t("status")}</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setAvailability(option.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${availability === option.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interests - matches filter options */}
        <Card className="border-border/30">
          <CardContent className="p-6 space-y-4">
            <Label className="text-foreground">{t("interests")}</Label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleLookingFor(option.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${lookingFor.includes(option.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Preferences */}
        <Card className="border-border/30">
          <CardContent className="p-6 space-y-4">
            <Label className="text-foreground">{t("searchPreferences")}</Label>
            <p className="text-xs text-muted-foreground -mt-2">
              {t("searchPreferencesDesc")}
            </p>

            {/* What you're looking for */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">{t("lookingFor")}</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "men" as SearchPreference, label: t("men") },
                  { id: "women" as SearchPreference, label: t("women") },
                  { id: "both" as SearchPreference, label: t("both") },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={async () => {
                      setSearchPreference(option.id);
                      if (user) {
                        await supabase.from("profiles").update({ search_preference: option.id }).eq("user_id", user.id);
                        // Update local profile state to prevent reversion if fetching happens
                        setProfile(prev => prev ? ({ ...prev, search_preference: option.id }) : null);
                        toast({ title: t("preferenceUpdated") });
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${searchPreference === option.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* How you appear */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">{t("showAs")}</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "man" as VisibleGender, label: t("man") },
                  { id: "woman" as VisibleGender, label: t("woman") },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={async () => {
                      setVisibleGender(option.id);
                      if (user) {
                        await supabase.from("profiles").update({ visible_gender: option.id }).eq("user_id", user.id);
                        // Update local profile state to prevent reversion
                        setProfile(prev => prev ? ({ ...prev, visible_gender: option.id }) : null);
                        toast({ title: t("preferenceUpdated") });
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${visibleGender === option.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NowPick Boost */}
        {user && profile && (
          <NowPickBoost
            userId={user.id}
            isPrime={profile.is_prime || false}
            nowpickActiveUntil={profile.nowpick_active_until}
            nowpickLastUsed={profile.nowpick_last_used}
            onBoostActivated={fetchProfile}
          />
        )}

        {/* Private Album Manager */}
        {user && (
          <PrivateAlbumManager
            userId={user.id}
            privatePhotos={privatePhotos}
            onPhotosChange={setPrivatePhotos}
          />
        )}


        {/* Prime upsell */}
        {!profile?.is_prime && (
          <Card className="border-prime/30 bg-prime/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-prime animate-prime-shimmer" />
                  <div>
                    <p className="font-medium text-foreground">NOWR Prime</p>
                    <p className="text-sm text-muted-foreground">
                      Más control. Más visibilidad.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-prime text-prime hover:bg-prime/10"
                  onClick={() => navigate("/prime")}
                >
                  Ver más
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default MyProfile;
