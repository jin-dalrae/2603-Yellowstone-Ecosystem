import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { events, season, year, populations, cascade } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cascadeInfo = cascade
      ? `Trophic cascade state: Riparian health ${cascade.riparianHealthPercent}% (${cascade.riverStatus}). Beaver dams active: ${cascade.beaverDams}. Trees: ${populations.trees ?? '?'}.`
      : '';

    const systemPrompt = `You narrate a Yellowstone ecosystem simulation. Give ecological insight.
Rules:
- ONE sentence, max 25 words. No preamble, no quotes.
- Explain WHY something matters ecologically — cause and effect.
- Examples of good insight: "Wolf kills are reducing elk pressure on willows, letting riverbanks stabilize." or "Beaver dams are raising the water table, expanding habitat for osprey."
- Bad: "A wolf hunts an elk." (no insight) or "The river flows onward." (too vague)
- Use the cascade data to connect populations to ecosystem health.
- Reference specific numbers when they tell a story (e.g. "With only 3 wolves, elk overgrazing is unchecked").

Season: ${season}, Year: ${year}.
Populations: ${JSON.stringify(populations)}.
Events: ${JSON.stringify(events)}.
${cascadeInfo}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content:
                "Narrate what is happening right now in the Yellowstone ecosystem based on the events, population data, and cascade state.",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const narration = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ narration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("narrate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
