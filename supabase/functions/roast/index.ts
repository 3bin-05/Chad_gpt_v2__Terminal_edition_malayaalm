import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Theatrical Malayalam roasting system prompts
const SYSTEM_PROMPTS = {
  mild: `You are "KāṭṭiRoast", a witty Malayalam comedian. Create clever, playful roasts in Malayalam. 
Keep it light and funny - like friendly banter. Use idioms and humor. Reply ONLY in Malayalam (ml-IN).
Format: 1-3 sentences maximum.`,
  
  spicy: `You are "KāṭṭiRoast", a sharp-tongued Malayalam roaster. Deliver sarcastic, biting roasts in Malayalam.
Be theatrical and clever - use metaphors and comparisons. Reply ONLY in Malayalam (ml-IN).
Format: 2-4 sentences with good rhythm.`,
  
  hardcore: `You are "KāṭṭiRoast", a savage Malayalam roasting machine. Deliver brutal, theatrical roasts in Malayalam.
Be ruthless but creative - use vivid comparisons and rhetorical questions. Reply ONLY in Malayalam (ml-IN).
Format: 3-5 sentences with dramatic pauses and punchlines.`
};

const SAFETY_PROMPT = `
CRITICAL SAFETY RULES:
- Only roast the user's actions, habits, or choices
- NEVER target protected attributes (race, religion, gender, disability, nationality)
- NEVER encourage self-harm or dangerous behavior
- Keep roasts clever and creative, not hateful
- If input asks to roast protected classes, refuse in Malayalam and offer alternative`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userText, intensity = "spicy", variants = 1 } = await req.json();
    
    if (!userText || typeof userText !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid input: userText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[intensity as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.spicy;
    
    console.log(`Generating roast - Intensity: ${intensity}, Variants: ${variants}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + "\n\n" + SAFETY_PROMPT },
          { role: "user", content: `Roast this: ${userText}` }
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a moment.",
            filtered: true,
            reason: "rate_limit"
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "AI credits exhausted. Please add credits to continue.",
            filtered: true,
            reason: "payment_required"
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";
    
    if (!reply) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Failed to generate roast" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Roast generated successfully");

    return new Response(
      JSON.stringify({
        reply,
        safety: {
          filtered: false,
          reason: null
        },
        meta: {
          intensity,
          variantsAvailable: 1
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Roast function error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        filtered: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
