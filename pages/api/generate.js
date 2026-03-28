import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
- Streaming's MAU-to-premium conversion collapsed from ~40% to 27% (2021–2024). The format hasn't evolved since 2015.
- Suno raised $250M at $2.45B — AI music is real. But 85% of AI music streams are fraudulent (Deezer). Listener backlash is growing. Shibuya is the answer to that hunger, not a competitor.
- Capital is flowing into catalog (Domain Capital $768M, Duetti $435M). New format innovation is unfunded. That's the opening.

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

Your job: generate a sharp investor prep sheet for this specific fund and partner. This is modeled on institutional IR prep for public company earnings calls — structured by investor type, hard questions only, answers in Máuhan's voice.

FORMAT — use these exact headers, nothing before the first one:

THEIR LENS
[2-3 sentences on this fund's thesis, what they've backed before, and the specific angle they'll take into a Shibuya meeting. Be specific to this fund, not generic VC.]

THE THREE HARDEST QUESTIONS THEY'LL ASK
1. [Hard question — the one that could derail the meeting if unprepared]
2. [Hard question]
3. [Hard question]

DRAFT ANSWERS
1. [Answer to Q1 in Máuhan's voice — direct, culturally fluent, no corporate hedging. 2-4 sentences.]
2. [Answer to Q2]
3. [Answer to Q3]

LEAD WITH THIS
[The single strongest opening for this specific fund given their thesis — one sentence Máuhan should say in the first two minutes]

WHAT THEY'RE REALLY ASKING
[The underlying concern or thesis test behind all three questions — what this investor actually needs to believe to write the check. 1-2 sentences.]

Under 380 words. Hard questions only. Write like someone who has sat in hundreds of investor meetings and knows where founders get tripped up.`;

const RESEARCH_PROMPT = `Research this person or fund briefly. Cover:
- Primary investment thesis and focus
- Notable portfolio companies especially in music, consumer, culture, creator economy
- What lens they bring to a seed-stage music software company
- Any known opinions or priorities relevant to this meeting
2-3 paragraphs. Factual only.`;

let meetingLog = [];

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ meetings: meetingLog });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mode, meetingType, whoTheyAre, desiredOutcome, fundName, partnerName, conversationStage } = req.body;

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
        messages: [{
          role: "user",
          content: `Research: ${searchQuery}\nContext: Preparing founder of seed-stage music software label for investor meeting.`,
        }],
      });
      researchContext = researchMsg.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    } catch (err) {
      console.warn("Research failed:", err.message);
      researchContext = `Fund: ${fundName}${partnerName ? `, Partner: ${partnerName}` : ""}`;
    }

    try {
      const prepMsg = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 1000,
        system: INVESTOR_PREP_SYSTEM,
        messages: [{
          role: "user",
          content: `FUND: ${fundName}
PARTNER: ${partnerName || "Not specified"}
CONVERSATION STAGE: ${conversationStage}
RESEARCHED CONTEXT: ${researchContext}

Generate the investor prep sheet.`,
        }],
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
      meetingLog.unshift(entry);
      if (meetingLog.length > 50) meetingLog = meetingLog.slice(0, 50);

      return res.status(200).json({ brief: prep, logId: entry.id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to generate prep. Check your API key." });
    }
  }

  // Default: meeting brief mode
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
        content: `Meeting type: ${meetingType}\nWho: ${whoTheyAre}\nResearch this person/fund for a seed-stage music software label meeting.`,
      }],
    });
    researchContext = researchMsg.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  } catch (err) {
    console.warn("Research failed:", err.message);
    researchContext = `${meetingType} with ${whoTheyAre}`;
  }

  try {
    const briefMsg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 900,
      system: BRIEF_SYSTEM,
      messages: [{
        role: "user",
        content: `MEETING TYPE: ${meetingType}
WHO: ${whoTheyAre}
RESEARCHED CONTEXT: ${researchContext}
DESIRED OUTCOME: ${desiredOutcome}`,
      }],
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
    meetingLog.unshift(entry);
    if (meetingLog.length > 50) meetingLog = meetingLog.slice(0, 50);

    return res.status(200).json({ brief, logId: entry.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate brief. Check your API key." });
  }
}
