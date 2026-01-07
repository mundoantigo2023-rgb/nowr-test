import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    country: string | null;
    error: string | null;
    loading: boolean;
}

export function useUserLocation() {
    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        city: null,
        country: null,
        error: null,
        loading: true,
    });

    const detectLocation = async (userId?: string) => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, loading: false, error: "Geolocation not supported" }));
            return;
        }

        setLocation(prev => ({ ...prev, loading: true }));

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 15000,
                    maximumAge: 300000, // 5 minutes cache
                });
            });

            const { latitude, longitude } = position.coords;

            // Reverse geocoding using OpenStreetMap Nominatim
            // We add a delay to allow UI to show loading state properly if needed, 
            // but primarily to not spam the API if called rapidly
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'es', // Default to Spanish as per app context
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

            const country = data.address?.country || null;

            const newLocation = {
                latitude,
                longitude,
                city,
                country,
                error: null,
                loading: false
            };

            setLocation(newLocation);

            // If userId is provided, save to profile immediately
            if (userId && (city || latitude)) {
                await supabase
                    .from("profiles")
                    .update({
                        city: city,
                        country: country, // Make sure this column exists or ignore if not
                        latitude: latitude,
                        longitude: longitude,
                    } as any) // Casting as any to avoid type errors if schema is slightly off
                    .eq("user_id", userId);
            }

            return newLocation;

        } catch (error: any) {
            console.error("Location detection error:", error);
            setLocation({
                latitude: null,
                longitude: null,
                city: null,
                country: null,
                error: error.message || "Unknown error",
                loading: false,
            });
            return null;
        }
    };

    return {
        ...location,
        detectLocation
    };
}
