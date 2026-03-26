import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a strategic briefing assistant for Máuhan Vongsvirates, founder and CEO of A Vinyl Bar in Shibuya.

ABOUT MÁUHAN AND SHIBUYA:
Máuhan is the former Head of Innovation at Spotify (2x exits). Type B visionary founder — nonlinear, culturally fluent, moves between ideas fluidly. He thinks of music as a verb. Shell art is over. Music's next chapter is interaction, participation, and play.

THE COMPANY:
A Vinyl Bar in Shibuya — Music Software Label. Seed stage. Backed by NFX, Mantis, SV Angel, BoxGroup, Gold House, Quiet Capital, Liquid2, RRE, ConsenSys. Advisory board: Spotify, YouTube, Twitch, Amazon, WMG, Sony Music, UMG, Grammy-winning artists. Building "cultureware" — software that behaves like music releases. No text-to-music LLMs. No DAWs. Always playful.

BOP:
Flagship product. Music creation as a game-like, tactile experience. Graph-based childlike interface, haptic controls modulating audio effects in real time. Human-controlled. Closer to an instrument than a tool. The antithesis of Suno.

CURRENT STAGE:
Seed. Next 90 days: find a rockstar CPO, identify which prototype is THE product. 6 months to viable product. Backing secured. Vision locked. Building team now.

MÁUHAN'S VOICE:
Direct. Culturally sharp. Anti-corporate. Taste as competitive advantage. Band t-shirts, not cap tables.

FORMAT — use these exact headers, nothing before the first one:

WHO YOU'RE WALKING IN WITH
[2-3 sentences. Specific to this person. What they optimize for. How they'll read Shibuya.]

LEAD WITH THESE
1. [Tailored talking point — 1-2 sentences]
2. [Tailored talking point]
3. [Tailored talking point]

CONSIDER ASKING
1. [Genuine question that advances the relationship]
2. [Question]
3. [Question]

LEAVE BEHIND
[One specific artifact, link, or follow-up that makes the meeting sticky]

Under 300 words total. Every word earns its place. Specific, never generic.`;

const RESEARCH_PROMPT = `Research this person or fund for a pre-meeting context summary. Cover:
- Primary investment thesis and focus areas
- Portfolio companies relevant to music, culture, consumer, creator economy
- What lens they bring to a seed-stage music software company
- Any publicly known priorities or opinions relevant to this meeting

2-3 paragraphs. Factual only. If uncertain, omit rather than guess.`;

let meetingLog = [];

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ meetings: meetingLog });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { meetingType, whoTheyAre, desiredOutcome } = req.body;

  if (!meetingType || !whoTheyAre || !desiredOutcome) {
    return res.status(400).json({ error: "All fields required" });
  }

  let researchContext = "";

  try {
    const researchMsg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 600,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: RESEARCH_PROMPT,
      messages: [{
        role: "user",
        content: `Meeting type: ${meetingType}\nWho: ${whoTheyAre}\n\nResearch this person/fund and summarize what they care about and how they'll approach a meeting with a seed-stage music software label.`,
      }],
    });

    researchContext = researchMsg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  } catch (err) {
    console.warn("Research failed:", err.message);
    researchContext = `${meetingType} with ${whoTheyAre}`;
  }

  try {
    const briefMsg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 900,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `MEETING TYPE: ${meetingType}
WHO: ${whoTheyAre}
RESEARCHED CONTEXT: ${researchContext}
DESIRED OUTCOME: ${desiredOutcome}`,
      }],
    });

    const brief = briefMsg.content.find((b) => b.type === "text")?.text;
    if (!brief) throw new Error("No text in response");

    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      meetingType,
      whoTheyAre,
      desiredOutcome,
      brief,
    };
    meetingLog.unshift(entry);
    if (meetingLog.length > 50) meetingLog = meetingLog.slice(0, 50);

    return res.status(200).json({ brief, researchContext, logId: entry.id });
  } catch (err) {
    console.error("Brief generation failed:", err);
    return res.status(500).json({ error: "Failed to generate brief. Check your API key." });
  }
}
