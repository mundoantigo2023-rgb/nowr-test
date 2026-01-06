import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retention notification configurations
const RETENTION_CONFIGS = {
  d7: {
    days: 7,
    title: "Ya sabes cómo funciona NOWR",
    message: "Cuando la intención es clara, todo fluye mejor.",
    cta_text: "Explorar ahora",
    cta_path: "/home",
  },
  d14: {
    days: 14,
    title: "Las conexiones más activas ocurren cuando estás visible",
    message: "NOWR Prime te pone delante.",
    cta_text: "Probar Prime",
    cta_path: "/prime",
  },
  d30: {
    days: 30,
    title: "Los usuarios Prime reciben más respuestas y más matches",
    message: "No es suerte. Es visibilidad.",
    cta_text: "Activar Prime",
    cta_path: "/prime",
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting retention notification processing...");

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const stats = { d7: 0, d14: 0, d30: 0 };

    // Process each retention tier
    for (const [type, config] of Object.entries(RETENTION_CONFIGS)) {
      console.log(`Processing ${type} notifications (${config.days} days)...`);

      // Calculate the date range for this tier
      // Users who registered exactly X days ago (within a 24-hour window)
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - config.days);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find users who registered on the target date
      const { data: eligibleUsers, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, display_name, is_prime, created_at')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (usersError) {
        console.error(`Error fetching users for ${type}:`, usersError);
        continue;
      }

      console.log(`Found ${eligibleUsers?.length || 0} eligible users for ${type}`);

      if (!eligibleUsers || eligibleUsers.length === 0) continue;

      // Check which users already have this notification type
      const userIds = eligibleUsers.map(u => u.user_id);
      const { data: existingNotifications, error: existingError } = await supabase
        .from('retention_notifications')
        .select('user_id')
        .in('user_id', userIds)
        .eq('notification_type', type);

      if (existingError) {
        console.error(`Error checking existing notifications for ${type}:`, existingError);
        continue;
      }

      const alreadyNotified = new Set(existingNotifications?.map(n => n.user_id) || []);

      // Create notifications for users who haven't received this type yet
      const newNotifications = eligibleUsers
        .filter(user => !alreadyNotified.has(user.user_id))
        // For d14 and d30, skip Prime users (they already converted)
        .filter(user => type === 'd7' || !user.is_prime)
        .map(user => ({
          user_id: user.user_id,
          notification_type: type,
          title: config.title,
          message: config.message,
          cta_text: config.cta_text,
          cta_path: config.cta_path,
          scheduled_for: now.toISOString(),
          sent_at: now.toISOString(),
        }));

      if (newNotifications.length > 0) {
        const { error: insertError } = await supabase
          .from('retention_notifications')
          .insert(newNotifications);

        if (insertError) {
          console.error(`Error inserting ${type} notifications:`, insertError);
        } else {
          console.log(`Created ${newNotifications.length} ${type} notifications`);
          stats[type as keyof typeof stats] = newNotifications.length;
        }
      }
    }

    console.log("Retention notification processing complete:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retention notifications processed",
        stats,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in retention notification function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
