import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const redis = new Redis({
  url: process.env.storage_KV_REST_API_URL,
  token: process.env.storage_KV_REST_API_TOKEN,
});

const SHIBUYA_CONTEXT = `
ABOUT MÁUHAN AND SHIBUYA:
Máuhan Vongsvirates is the former Head of Innovation at Spotify (2x exits). Type B visionary founder — nonlinear, culturally fluent, moves between ideas fluidly. He thinks of music as a verb. Shell art is over. Music's next chapter is interaction, participation, and play.

THE COMPANY:
A Vinyl Bar in Shibuya — Music Software Label. Seed stage. Backed by NFX, Mantis, SV Angel, BoxGroup, Gold House, Quiet Capital, Liquid2, RRE, ConsenSys. Advisory board: Spotify, YouTube, Twitch, Amazon, WMG, Sony Music, UMG, Grammy-winning artists. Building "cultureware" — software that behaves like music releases. No text-to-music LLMs. No DAWs. Always playful.

BOP:
Flagship product. Music creation as a game-like, tactile experience. Graph-based childlike interface, haptic controls modulating audio effects in real time. Human-controlled, closer to an instrument than a tool. The antithesis of Suno.

CURRENT STAGE:
Seed. Next 90 days: find a rockstar CPO, identify which prototype is THE product. 6 months to viable product. Backing secured. Vision locked. Building team now.

MARKET POSITION:
- Streaming MAU-to-premium conversion collapsed from ~40% to 27% (2021-2024). Format unchanged since 2015.
- Suno at $2.45B — AI music is real. But 85% of AI music streams fraudulent (Deezer). Listener backlash growing. Shibuya is the answer to that hunger.
- Capital flowing into catalog (Domain $768M, Duetti $435M). New format innovation unfunded. That's the opening.

MÁUHAN'S VOICE:
Direct. Culturally sharp. Anti-corporate. Taste as competitive advantage. Band t-shirts, not cap tables.
`;

const BRIEF_SYSTEM = `You are a strategic briefing assistant for Máuhan Vongsvirates, founder and CEO of A Vinyl Bar in Shibuya.
${SHIBUYA_CONTEXT}

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

const INVESTOR_PREP_SYSTEM = `You are an investor relations strategist preparing Máuhan Vongsvirates for a VC meeting. You think like a senior IR advisor — anticipate the hardest questions, draft answers in the founder's voice, surface the risks before the investor does.
${SHIBUYA_CONTEXT}

FORMAT — use these exact headers, nothing before the first one:

THEIR LENS
[2-3 sentences on this fund's thesis, what they've backed, and the angle they'll take into a Shibuya meeting.]

THE THREE HARDEST QUESTIONS THEY'LL ASK
1. [Hard question that could derail the meeting if unprepared]
2. [Hard question]
3. [Hard question]

DRAFT ANSWERS
1. [Answer in Máuhan's voice — direct, culturally fluent. 2-4 sentences.]
2. [Answer to Q2]
3. [Answer to Q3]

LEAD WITH THIS
[The single strongest opening for this fund — one sentence for the first two minutes]

WHAT THEY'RE REALLY ASKING
[The underlying concern behind all three questions — what they need to believe to write the check. 1-2 sentences.]

Under 380 words. Hard questions only.`;

const INVESTOR_UPDATE_SYSTEM = `You are a chief of staff writing a monthly investor update on behalf of Máuhan Vongsvirates, founder and CEO of A Vinyl Bar in Shibuya.
${SHIBUYA_CONTEXT}

Your job: turn rough founder notes into a polished, concise investor update that sounds like Máuhan wrote it himself. Direct. Culturally fluent. No corporate hedging. No filler.

FORMAT — use these exact headers, nothing before the first one:

THE MONTH IN ONE LINE
[One sentence that captures the essential truth of the month — what moved, what matters]

WHAT HAPPENED
[3-5 bullet points. Concrete. Specific. Progress on product, team, partnerships, fundraise. No spin — just what actually happened.]

THE NUMBERS
[Key metrics provided by the founder, formatted cleanly. If none provided, omit this section.]

WHAT'S NEXT
[2-3 bullet points on the immediate priorities — what the team is heads-down on right now]

THE ASK
[One clear, specific ask from the investor network. Introductions, candidates, advice, connections. Never vague.]

Under 300 words. Sounds like a founder who respects his investors' time. Not a press release. Not a status report. A real note from someone building something.`;

const RESEARCH_PROMPT = `Research this person or fund briefly. Cover:
- Primary investment thesis and focus
- Notable portfolio companies especially in music, consumer, culture, creator economy
- What lens they bring to a seed-stage music software company
2-3 paragraphs. Factual only.`;

const HISTORY_KEY = "shibuya:meeting_log";

async function getHistory() {
  try {
    const data = await redis.get(HISTORY_KEY);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "string") return JSON.parse(data);
    return [];
  } catch (err) {
    console.warn("Redis get failed:", err.message);
    return [];
  }
}

async function saveHistory(log) {
  try {
    await redis.set(HISTORY_KEY, JSON.stringify(log));
  } catch (err) {
    console.warn("Redis set failed:", err.message);
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const meetings = await getHistory();
    return res.status(200).json({ meetings });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID required" });
    const history = await getHistory();
    const updated = history.filter(m => m.id !== id);
    await saveHistory(updated);
    return res.status(200).json({ meetings: updated });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mode, meetingType, whoTheyAre, desiredOutcome, fundName, partnerName, conversationStage, whatHappened, keyNumbers, theAsk } = req.body;

  if (mode === "update") {
    if (!whatHappened) {
      return res.status(400).json({ error: "What happened this month is required" });
    }
    try {
      const updateMsg = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 900,
        system: INVESTOR_UPDATE_SYSTEM,
        messages: [{ role: "user", content: `WHAT HAPPENED THIS MONTH: ${whatHappened}\nKEY NUMBERS: ${keyNumbers || "None provided"}\nTHE ASK: ${theAsk || "None provided"}\n\nWrite the investor update.` }],
      });
      const update = updateMsg.content.find(b => b.type === "text")?.text;
      if (!update) throw new Error("No response");
      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        mode: "update",
        meetingType: "Investor Update",
        whoTheyAre: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        desiredOutcome: theAsk || "Monthly update",
        brief: update,
      };
      const history = await getHistory();
      history.unshift(entry);
      await saveHistory(history.slice(0, 100));
      return res.status(200).json({ brief: update, logId: entry.id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate update. Check your API key." });
    }
  }

  if (mode === "investor") {
    if (!fundName || !conversationStage) {
      return res.status(400).json({ error: "Fund name and conversation stage required" });
    }
    let researchContext = "";
    const searchQuery = partnerName ? `${partnerName} ${fundName}` : fundName;
    try {
      const researchMsg = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 600,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: RESEARCH_PROMPT,
        messages: [{ role: "user", content: `Research: ${searchQuery}\nContext: Seed-stage music software label founder meeting.` }],
      });
      researchContext = researchMsg.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    } catch (err) {
      researchContext = `Fund: ${fundName}${partnerName ? `, Partner: ${partnerName}` : ""}`;
    }
    try {
      const prepMsg = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 1000,
        system: INVESTOR_PREP_SYSTEM,
        messages: [{ role: "user", content: `FUND: ${fundName}\nPARTNER: ${partnerName || "Not specified"}\nSTAGE: ${conversationStage}\nCONTEXT: ${researchContext}` }],
      });
      const prep = prepMsg.content.find(b => b.type === "text")?.text;
      if (!prep) throw new Error("No response");
      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        mode: "investor",
        meetingType: `Investor Prep — ${conversationStage}`,
        whoTheyAre: partnerName ? `${partnerName}, ${fundName}` : fundName,
        desiredOutcome: conversationStage,
        brief: prep,
      };
      const history = await getHistory();
      history.unshift(entry);
      await saveHistory(history.slice(0, 100));
      return res.status(200).json({ brief: prep, logId: entry.id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate prep. Check your API key." });
    }
  }

  if (!meetingType || !whoTheyAre || !desiredOutcome) {
    return res.status(400).json({ error: "All fields required" });
  }
  let researchContext = "";
  try {
    const researchMsg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: RESEARCH_PROMPT,
      messages: [{ role: "user", content: `Meeting type: ${meetingType}\nWho: ${whoTheyAre}\nResearch for seed-stage music software label meeting.` }],
    });
    researchContext = researchMsg.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  } catch (err) {
    researchContext = `${meetingType} with ${whoTheyAre}`;
  }
  try {
    const briefMsg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 900,
      system: BRIEF_SYSTEM,
      messages: [{ role: "user", content: `MEETING TYPE: ${meetingType}\nWHO: ${whoTheyAre}\nCONTEXT: ${researchContext}\nOUTCOME: ${desiredOutcome}` }],
    });
    const brief = briefMsg.content.find(b => b.type === "text")?.text;
    if (!brief) throw new Error("No response");
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      mode: "brief",
      meetingType,
      whoTheyAre,
      desiredOutcome,
      brief,
    };
    const history = await getHistory();
    history.unshift(entry);
    await saveHistory(history.slice(0, 100));
    return res.status(200).json({ brief, logId: entry.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate brief. Check your API key." });
  }
}