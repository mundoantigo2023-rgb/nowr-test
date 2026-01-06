import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Flirty pre-defined responses in Spanish
const FLIRTY_RESPONSES = [
  "Hola guapo 😏 Me alegra que me escribas...",
  "Mmm... interesante. Cuéntame más sobre ti 💋",
  "¿Qué planes tienes para esta noche? 😈",
  "Me gusta tu estilo... ¿Qué buscas aquí? 🔥",
  "Así que te animaste a escribirme... me gusta 😉",
  "¿Siempre eres tan directo? Me encanta 💕",
  "Estoy aburrida... ¿me entretienes? 😏",
  "Qué casualidad, justo estaba pensando en conocer a alguien nuevo...",
  "Tienes algo especial, lo puedo sentir 🌟",
  "¿Y qué te gustaría hacer si nos viéramos? 😈",
  "Me intriga lo que tienes en mente... 💭",
  "¿Eres de los que hablan o de los que actúan? 😏",
  "Estás muy callado... ¿nervioso? Tranquilo, no muerdo... mucho 😈",
  "Me encanta la química que siento aquí...",
  "Cuéntame un secreto tuyo 🤫",
  "¿Crees en el amor a primera vista... o debo pasar de nuevo? 💋",
  "Qué bien que me escribiste, justo lo necesitaba 🥰",
  "¿Siempre sabes qué decir o solo conmigo? 😏",
  "Me gusta cómo piensas... sigue así 🔥",
  "Podríamos tomar algo juntos, ¿no crees? 🍷",
];

// Response variations based on message content patterns
const CONTEXTUAL_RESPONSES: Record<string, string[]> = {
  hola: [
    "Hola guapo! 😊 Por fin me escribes...",
    "Hey! 👋 Me alegra verte por aquí...",
    "Holaa 💕 ¿Cómo estás?",
  ],
  foto: [
    "¿Te gustaron mis fotos? 😏 Tengo más en privado...",
    "Mmm gracias por notar 💋 Me esforcé en elegirlas...",
  ],
  guapa: [
    "Aww gracias! 🥰 Tú tampoco estás nada mal...",
    "Me haces sonrojar 😊 Eres muy dulce...",
  ],
  quedamos: [
    "¿Tan rápido? 😏 Me gusta la iniciativa...",
    "Podría ser... ¿Qué tienes en mente? 😈",
  ],
  noche: [
    "Estoy libre esta noche... 😏 ¿Ideas?",
    "Las noches son más divertidas en compañía 🌙",
  ],
};

function getRandomResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for contextual responses first
  for (const [keyword, responses] of Object.entries(CONTEXTUAL_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  // Fall back to general flirty responses
  return FLIRTY_RESPONSES[Math.floor(Math.random() * FLIRTY_RESPONSES.length)];
}

// Simulated delay to make it feel more natural (1-3 seconds)
function getRandomDelay(): number {
  return Math.floor(Math.random() * 2000) + 1000;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matchId, messageContent, botUserId } = await req.json();
    
    if (!matchId || !messageContent || !botUserId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Add a small delay to simulate typing
    await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

    // Generate response
    const responseText = getRandomResponse(messageContent);

    // Insert the bot's response
    const { error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: botUserId,
        content: responseText,
      });

    if (insertError) {
      console.error("Error inserting auto-reply:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Auto-reply sent in match ${matchId}: "${responseText}"`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: responseText 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auto-reply error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
