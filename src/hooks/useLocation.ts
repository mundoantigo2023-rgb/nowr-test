import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useLocation = () => {
    const { toast } = useToast();
    const [detecting, setDetecting] = useState(false);

    const detectLocation = async (userId: string) => {
        if (!navigator.geolocation) return;

        setDetecting(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes
                });
            });

            const { latitude, longitude } = position.coords;

            // Reverse geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                { headers: { 'Accept-Language': 'es' } }
            );

            if (!response.ok) throw new Error('Geocoding failed');

            const data = await response.json();
            const city = data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                data.address?.municipality ||
                data.address?.county ||
                null;

            if (city && userId) {
                const { error } = await (supabase
                    .from("profiles") as any)
                    .update({
                        city: city,
                        latitude: latitude,
                        longitude: longitude,
                    })
                    .eq("user_id", userId);

                if (error) console.error("Error updating location:", error);
            }
        } catch (error) {
            console.log("Location auto-detection failed/skipped:", error);
        } finally {
            setDetecting(false);
        }
    };

    useEffect(() => {
        // Auto-detect on mount if user is logged in
        const checkUserAndDetect = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                detectLocation(session.user.id);
            }
        };
        checkUserAndDetect();
    }, []);

    return { detectLocation };
};
