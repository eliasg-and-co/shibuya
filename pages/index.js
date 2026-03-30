import { useState, useEffect, useRef } from "react";
import Head from "next/head";

const MEETING_TYPES = [
  "Investor — Music Industry Fund",
  "Investor — Consumer Tech / VC",
  "Investor — Strategic (DSP / Label)",
  "Potential CPO / Hire",
  "Label or Industry Partner",
  "Press / Media",
  "Artist or Creator",
  "Other",
];

const CONVO_STAGES = [
  "First meeting — intro",
  "Follow-up — building conviction",
  "Partner meeting — full firm",
  "Term sheet — closing",
];

const BRIEF_LABELS = ["WHO YOU'RE WALKING IN WITH","LEAD WITH THESE","CONSIDER ASKING","LEAVE BEHIND"];
const PREP_LABELS = ["THEIR LENS","THE THREE HARDEST QUESTIONS THEY'LL ASK","DRAFT ANSWERS","LEAD WITH THIS","WHAT THEY'RE REALLY ASKING"];
const UPDATE_LABELS = ["THE MONTH IN ONE LINE","WHAT HAPPENED","THE NUMBERS","WHAT'S NEXT","THE ASK"];
const MODES = ["brief", "investor", "update"];

const PLAYLIST = [
  { title: "northern organix", artist: "lojii, Swarvy", url: "https://open.spotify.com/track/4ZROo3NwUM3UusHizN33h3" },
  { title: "Freestyle Shit", artist: "Freddie Gibbs, Madlib", url: "https://open.spotify.com/track/2cHbaJXQcw14NzfplQoUWi" },
  { title: "Drive In", artist: "Blu, Madlib, MED, Aloe Blacc", url: "https://open.spotify.com/track/6mBbycgdWgHMPNyJLCEoW6" },
  { title: "Nu Path", artist: "Ivan Ave", url: "https://open.spotify.com/track/2fqp0U2suR0xgrc0fTaNJH" },
  { title: "Skatiiin", artist: "Swarvy, Pink Siifu", url: "https://open.spotify.com/track/6o1VVxAkcyziXI2T3ginhr" },
  { title: "Find a Topic (homies begged)", artist: "Isaiah Rashad", url: "https://open.spotify.com/track/17JA4HlieSH7TY3pQk21MJ" },
  { title: "On the Level", artist: "Mac DeMarco", url: "https://open.spotify.com/track/36rqjSUBaArtMBLWrzwInc" },
  { title: "Time: The Donut of the Heart", artist: "J Dilla", url: "https://open.spotify.com/track/7oeWitA7Lu8O76NrmhfgZ8" },
  { title: "House (feat. Mick Jenkins)", artist: "EARTHGANG, Mick Jenkins", url: "https://open.spotify.com/track/0ntHEP3DJyS2qgJgqbWNxh" },
  { title: "Boblo Boat (feat. J. Cole)", artist: "Royce Da 5'9\", J. Cole", url: "https://open.spotify.com/track/6Gbj7s07M5pF76wfHPOxQZ" },
  { title: "Biscuit Town", artist: "King Krule", url: "https://open.spotify.com/track/289GrO286LzD5Oa6BXBPel" },
  { title: "R.I.P. Kevin Miller", artist: "Isaiah Rashad", url: "https://open.spotify.com/track/6zSwnPvoqQ2bzvYMlt3u4u" },
  { title: "atherton_hifi", artist: "Toro y Moi", url: "https://open.spotify.com/track/0HycNw19wHCEH5V10vA1jF" },
  { title: "You Stressin'", artist: "Bishop Nehru", url: "https://open.spotify.com/track/60NwuLLD9fpWZcDIfjv1NS" },
  { title: "Drip", artist: "Luke James, A$AP Ferg", url: "https://open.spotify.com/track/6gn1duUUcXWUZZMIZ4Op4M" },
  { title: "Lemonade", artist: "Da-P, Mick Jenkins", url: "https://open.spotify.com/track/3taa9MzptO16bBlsgbKt1A" },
  { title: "Trail Mix", artist: "Terrace Martin, Buddy, Rose Gold", url: "https://open.spotify.com/track/5ylgzfmgEXuWI53ukPoMLn" },
  { title: "Eternal Light", artist: "Free Nationals, Chronixx", url: "https://open.spotify.com/track/5NM8v7DOexgrrxefEnKR2V" },
  { title: "The Rivington", artist: "Free Nationals, Conway, Westside Gunn, Joyce Wrice", url: "https://open.spotify.com/track/0erHRpul2OsRSuImLHQ3X4" },
  { title: "Socially Awkward", artist: "Kiefer", url: "https://open.spotify.com/track/2yE3omg2KMRfFw4ukBlDIJ" },
  { title: "Go with It (feat. VIC MENSA)", artist: "The Internet, VIC MENSA", url: "https://open.spotify.com/track/5cpB6MXX1RmdVHnTLcKtHC" },
  { title: "Marcy Me", artist: "JAŸ-Z", url: "https://open.spotify.com/track/5oynsOy80DnodTslgaj3cr" },
  { title: "Echo (feat. Nas)", artist: "Swizz Beatz, Nas", url: "https://open.spotify.com/track/50sSNm5rq7O6wqvkIn42Zf" },
  { title: "Marrakech", artist: "Tom Misch", url: "https://open.spotify.com/track/4YLbQGnk6iIgelpUIwbmxm" },
  { title: "untitled 06 | 06.30.2014.", artist: "Kendrick Lamar", url: "https://open.spotify.com/track/4M2t7bP4Mq87mGMn0PObUX" },
  { title: "Carefree", artist: "Mick Jenkins", url: "https://open.spotify.com/track/5CTaFr3yPs4SEtCMt70Hfv" },
  { title: "Sundown Syndrome", artist: "Tame Impala", url: "https://open.spotify.com/track/3ZuT0Evo8chdVM6rPXXqgd" },
  { title: "Planned Attack", artist: "Quasimoto, Madlib", url: "https://open.spotify.com/track/6em5UF32ahwLxtW1DxIQnf" },
];

function getDailyTrack() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return PLAYLIST[dayOfYear % PLAYLIST.length];
}

function getDateString() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function parseSections(text, labels) {
  const result = {};
  labels.forEach((label, idx) => {
    const start = text.indexOf(label);
    if (start === -1) return;
    const contentStart = start + label.length;
    const nextLabel = labels.slice(idx + 1).find(l => text.indexOf(l) > start);
    const end = nextLabel ? text.indexOf(nextLabel) : text.length;
    result[label] = text.slice(contentStart, end).trim();
  });
  return result;
}

function getLabelsForMode(mode) {
  if (mode === "investor") return PREP_LABELS;
  if (mode === "update") return UPDATE_LABELS;
  return BRIEF_LABELS;
}

function ResultView({ brief, meta, onBack }) {
  const labels = getLabelsForMode(meta.mode);
  const parsed = parseSections(brief, labels);
  const date = new Date(meta.timestamp || Date.now());
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="brief-view">
      <button className="back-btn" onClick={onBack}>← back</button>
      <div className="brief-chip-row">
        <span className="chip">{meta.mode === "investor" ? "Investor Prep" : meta.mode === "update" ? "Investor Update" : meta.meetingType}</span>
        <span className="chip-time">{dateStr}</span>
      </div>
      <div className="brief-who">{meta.whoTheyAre}</div>
      <div className="sections">
        {labels.map((label) => parsed[label] ? (
          <div key={label} className="section">
            <div className="section-label">{label}</div>
            <div className="section-body">
              {parsed[label].split("\n").filter(l => l.trim()).map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        ) : null)}
      </div>
      <button className="print-btn" onClick={() => window.print()}>print ↗</button>
    </div>
  );
}

function HistoryItem({ meeting, onClick, onDelete }) {
  const date = new Date(meeting.timestamp);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const cls = meeting.mode === "investor" ? "is-investor" : meeting.mode === "update" ? "is-update" : "";
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${meeting.whoTheyAre}"?`)) onDelete(meeting.id);
  };
  return (
    <div className={`history-item ${cls}`}>
      <button className="history-item-body" onClick={onClick}>
        <div className="history-item-top">
          <span className="history-who">{meeting.whoTheyAre}</span>
          <span className="history-date">{dateStr}</span>
        </div>
        <div className="history-type">{meeting.meetingType}</div>
      </button>
      <button className="history-delete" onClick={handleDelete}>×</button>
    </div>
  );
}

function SongOfDay() {
  const track = getDailyTrack();
  return (
    <a href={track.url} target="_blank" rel="noopener noreferrer" className="song-strip">
      <div className="song-icon">♫</div>
      <div className="song-info">
        <div className="song-label">today's listen</div>
        <div className="song-title">{track.title}</div>
        <div className="song-artist">{track.artist}</div>
      </div>
      <div className="song-arrow">↗</div>
    </a>
  );
}

export default function Home() {
  const [appMode, setAppMode] = useState("brief");
  const [view, setView] = useState("form");
  const [briefForm, setBriefForm] = useState({ meetingType: "", whoTheyAre: "", desiredOutcome: "" });
  const [investorForm, setInvestorForm] = useState({ fundName: "", partnerName: "", conversationStage: "" });
  const [updateForm, setUpdateForm] = useState({ whatHappened: "", keyNumbers: "", theAsk: "" });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState("Researching...");
  const [pillStyle, setPillStyle] = useState({ left: 3, width: 80 });

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const toggleRef = useRef(null);
  const btnRefs = useRef([]);

  const loadingMessages = ["Researching...", "Reading the room...", "Building the brief...", "Almost there..."];
  const isInvestor = appMode === "investor";
  const isUpdate = appMode === "update";
  const modeIdx = MODES.indexOf(appMode);

  useEffect(() => {
    fetch("/api/generate")
      .then(r => r.json())
      .then(data => { if (data.meetings) setHistory(data.meetings); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const btn = btnRefs.current[modeIdx];
    const parent = toggleRef.current;
    if (!btn || !parent) return;
    const btnRect = btn.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    setPillStyle({ left: btnRect.left - parentRect.left - 3 + 3, width: btnRect.width });
  }, [appMode, modeIdx]);

  const switchMode = (mode) => {
    setAppMode(mode);
    setView("form");
    setError(null);
    setResult(null);
  };

  const handleSwipe = (e) => {
    if (view !== "form" && view !== "loading") return;
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) < 50 || dy > 60) return;
    const currentIdx = MODES.indexOf(appMode);
    if (dx > 0 && currentIdx < MODES.length - 1) switchMode(MODES[currentIdx + 1]);
    if (dx < 0 && currentIdx > 0) switchMode(MODES[currentIdx - 1]);
    touchStartX.current = null;
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch("/api/generate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.meetings) setHistory(data.meetings);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setView("loading");
    let msgIdx = 0;
    setLoadingMsg(loadingMessages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 2800);

    let payload;
    if (isUpdate) payload = { mode: "update", ...updateForm };
    else if (isInvestor) payload = { mode: "investor", ...investorForm };
    else payload = { mode: "brief", ...briefForm };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.error || "Failed");
      const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const entry = {
        id: data.logId || Date.now(),
        timestamp: new Date().toISOString(),
        mode: appMode,
        meetingType: isUpdate ? "Investor Update" : isInvestor ? `Investor Prep — ${investorForm.conversationStage}` : briefForm.meetingType,
        whoTheyAre: isUpdate ? month : isInvestor ? (investorForm.partnerName ? `${investorForm.partnerName}, ${investorForm.fundName}` : investorForm.fundName) : briefForm.whoTheyAre,
        desiredOutcome: isUpdate ? updateForm.theAsk : isInvestor ? investorForm.conversationStage : briefForm.desiredOutcome,
        brief: data.brief,
      };
      setResult(entry);
      setHistory(prev => [entry, ...prev].slice(0, 50));
      setView("brief");
    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setView("form");
    }
  };

  const modeClass = isInvestor ? "mode-investor" : isUpdate ? "mode-update" : "mode-brief";

  return (
    <>
      <Head>
        <title>Brief — Shibuya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </Head>

      <div className={`app ${modeClass}`}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={handleSwipe}
      >
        <header>
          <div className="header-inner">
            <div className="wordmark">
              <span className="wm-a">A Vinyl Bar in Shibuya</span>
              <span className="wm-dot"> · </span>
              <span className="wm-b">brief</span>
            </div>
            {view !== "history" ? (
              <button className="nav-btn" onClick={() => setView("history")}>
                history {history.length > 0 && <span className="badge">{history.length}</span>}
              </button>
            ) : (
              <button className="nav-btn" onClick={() => setView("form")}>+ new</button>
            )}
          </div>
        </header>

        <main>
          {(view === "form" || view === "loading") && (
            <>
              <div className="date-line">{getDateString()}</div>
              <div className="mode-toggle-wrap">
                <div className="mode-toggle" ref={toggleRef}>
                  <div className="toggle-pill" style={{ left: pillStyle.left, width: pillStyle.width }} />
                  {MODES.map((m, i) => (
                    <button
                      key={m}
                      ref={el => btnRefs.current[i] = el}
                      className={`toggle-btn ${appMode === m ? "active" : ""}`}
                      onClick={() => switchMode(m)}
                    >
                      {m === "brief" ? "Meeting" : m === "investor" ? "Investor Prep" : "Update"}
                    </button>
                  ))}
                </div>
                <div className="swipe-dots">
                  {MODES.map((m, i) => <span key={m} className={`swipe-dot ${i === modeIdx ? "active" : ""}`} />)}
                </div>
              </div>
            </>
          )}

          {view === "form" && appMode === "brief" && (
            <div className="fade-in">
              <div className="form-intro">
                <h1>Who are you<br /><em>walking into?</em></h1>
                <p className="form-sub">Fill this in. Brief in 60 seconds.</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Meeting type</label>
                  <div className="select-wrap">
                    <select value={briefForm.meetingType} onChange={e => setBriefForm({ ...briefForm, meetingType: e.target.value })} required>
                      <option value="" disabled>Select —</option>
                      {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="select-arrow">↓</span>
                  </div>
                </div>
                <div className="field">
                  <label>Who are you meeting</label>
                  <input type="text" placeholder="Name, company, role" value={briefForm.whoTheyAre} onChange={e => setBriefForm({ ...briefForm, whoTheyAre: e.target.value })} required />
                  <div className="field-hint">We'll research them automatically.</div>
                </div>
                <div className="field">
                  <label>What you want from this meeting</label>
                  <textarea placeholder="The specific outcome you're walking in for" value={briefForm.desiredOutcome} onChange={e => setBriefForm({ ...briefForm, desiredOutcome: e.target.value })} required rows={3} />
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="submit-btn">Generate brief →</button>
              </form>
              <SongOfDay />
            </div>
          )}

          {view === "form" && appMode === "investor" && (
            <div className="fade-in">
              <div className="form-intro">
                <h1>Who's writing<br /><em>the check?</em></h1>
                <p className="form-sub">Hard questions. Draft answers. Walk in ready.</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Fund name</label>
                  <input type="text" placeholder="e.g. Mantis, NFX, BoxGroup" value={investorForm.fundName} onChange={e => setInvestorForm({ ...investorForm, fundName: e.target.value })} required />
                  <div className="field-hint">We'll research their thesis automatically.</div>
                </div>
                <div className="field">
                  <label>Partner name (optional)</label>
                  <input type="text" placeholder="e.g. Ben Horowitz" value={investorForm.partnerName} onChange={e => setInvestorForm({ ...investorForm, partnerName: e.target.value })} />
                </div>
                <div className="field">
                  <label>Where are you in the conversation</label>
                  <div className="select-wrap">
                    <select value={investorForm.conversationStage} onChange={e => setInvestorForm({ ...investorForm, conversationStage: e.target.value })} required>
                      <option value="" disabled>Select —</option>
                      {CONVO_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="select-arrow">↓</span>
                  </div>
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="submit-btn">Generate prep →</button>
              </form>
              <SongOfDay />
            </div>
          )}

          {view === "form" && appMode === "update" && (
            <div className="fade-in">
              <div className="form-intro">
                <h1>What moved<br /><em>this month?</em></h1>
                <p className="form-sub">Rough notes in. Polished update out.</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>What happened this month</label>
                  <textarea placeholder="Bullet points, rough notes, stream of consciousness — anything." value={updateForm.whatHappened} onChange={e => setUpdateForm({ ...updateForm, whatHappened: e.target.value })} required rows={5} />
                </div>
                <div className="field">
                  <label>Key numbers (optional)</label>
                  <textarea placeholder="Users, demos booked, MRR, anything you're tracking" value={updateForm.keyNumbers} onChange={e => setUpdateForm({ ...updateForm, keyNumbers: e.target.value })} rows={2} />
                </div>
                <div className="field">
                  <label>The ask</label>
                  <textarea placeholder="What do you need from your investor network right now?" value={updateForm.theAsk} onChange={e => setUpdateForm({ ...updateForm, theAsk: e.target.value })} rows={2} />
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="submit-btn">Generate update →</button>
              </form>
              <SongOfDay />
            </div>
          )}

          {view === "loading" && (
            <div className="loading-wrap fade-in">
              <div className="loading-label">{loadingMsg}</div>
              <div className="loading-dots"><span /><span /><span /></div>
            </div>
          )}

          {view === "brief" && result && (
            <div className="fade-in">
              <ResultView brief={result.brief} meta={result} onBack={() => setView("form")} />
            </div>
          )}

          {view === "history" && (
            <div className="fade-in">
              <div className="history-head">
                <h2>Meeting history</h2>
                {history.length === 0 && <p className="history-empty">No briefs yet.</p>}
              </div>
              {history.length > 0 && (
                <>
                  <div className="history-stats">
                    <div className="stat-box"><div className="stat-num">{history.length}</div><div className="stat-label">Total</div></div>
                    <div className="stat-box"><div className="stat-num">{history.filter(h => h.mode === "investor").length}</div><div className="stat-label">Investor</div></div>
                    <div className="stat-box"><div className="stat-num">{history.filter(h => h.mode === "brief").length}</div><div className="stat-label">Meetings</div></div>
                  </div>
                  <div className="history-list">
                    {history.map(item => (
                      <HistoryItem key={item.id} meeting={item} onDelete={handleDelete} onClick={() => {
                        setAppMode(item.mode || "brief");
                        setResult(item);
                        setView("brief");
                      }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0c0c0c; --surface: #161616; --border: rgba(255,255,255,0.09);
          --border-active: rgba(255,255,255,0.22); --ink: #e8e4dc;
          --ink-mid: rgba(232,228,220,0.55); --ink-dim: rgba(232,228,220,0.28);
          --accent: #c8a96e; --accent-dim: rgba(200,169,110,0.15); --red: #e05c5c;
          --mono: 'DM Mono', monospace; --serif: 'Instrument Serif', serif; --r: 12px;
        }
        .mode-investor { --bg: #f5f2ec; --surface: #ede9e0; --border: rgba(0,0,0,0.09); --border-active: rgba(0,0,0,0.22); --ink: #1a1a1a; --ink-mid: rgba(26,26,26,0.55); --ink-dim: rgba(26,26,26,0.35); --accent: #b8922a; --accent-dim: rgba(184,146,42,0.12); --red: #c0392b; }
        .mode-update { --bg: #0a0f1a; --surface: #111827; --border: rgba(100,140,255,0.12); --border-active: rgba(100,140,255,0.3); --ink: #e4eaf8; --ink-mid: rgba(228,234,248,0.55); --ink-dim: rgba(228,234,248,0.28); --accent: #7b9cff; --accent-dim: rgba(123,156,255,0.12); --red: #e05c5c; }

        html, body { background: var(--bg); color: var(--ink); font-family: var(--mono); font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; min-height: 100dvh; overscroll-behavior: none; transition: background 0.35s ease, color 0.35s ease; }
        .app { max-width: 480px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; background: var(--bg); transition: background 0.35s ease; }
        header { position: sticky; top: 0; z-index: 100; background: var(--bg); border-bottom: 1px solid var(--border); padding: 0 20px; transition: background 0.35s ease, border-color 0.35s ease; }
        .header-inner { display: flex; justify-content: space-between; align-items: center; height: 56px; }
        .wordmark { display: flex; align-items: baseline; }
        .wm-a { font-family: var(--serif); font-size: 0.88rem; color: var(--ink); opacity: 0.75; }
        .wm-dot { opacity: 0.3; font-size: 0.88rem; margin: 0 6px; }
        .wm-b { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-mid); }
        .nav-btn { background: none; border: 1px solid var(--border); color: var(--ink-mid); font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.1em; padding: 6px 14px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .badge { background: var(--accent); color: var(--bg); font-size: 0.58rem; border-radius: 10px; padding: 1px 6px; }
        main { flex: 1; padding: 28px 20px 80px; }

        .date-line { font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-dim); text-align: center; margin-bottom: 16px; }

        .mode-toggle-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 32px; gap: 12px; }
        .mode-toggle { position: relative; display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: 30px; padding: 3px; gap: 0; transition: background 0.35s ease, border-color 0.35s ease; }
        .toggle-pill { position: absolute; top: 3px; height: calc(100% - 6px); background: var(--accent); border-radius: 26px; transition: left 0.28s cubic-bezier(0.34,1.56,0.64,1), width 0.28s cubic-bezier(0.34,1.56,0.64,1); pointer-events: none; z-index: 0; }
        .toggle-btn { position: relative; z-index: 1; font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 8px 16px; border-radius: 26px; border: none; background: transparent; color: var(--ink-dim); cursor: pointer; transition: color 0.25s; -webkit-tap-highlight-color: transparent; white-space: nowrap; }
        .toggle-btn.active { color: var(--bg); }
        .swipe-dots { display: flex; gap: 6px; }
        .swipe-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ink-dim); transition: background 0.25s, transform 0.25s; }
        .swipe-dot.active { background: var(--accent); transform: scale(1.4); }

        .fade-in { animation: fadeUp 0.35s ease forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .form-intro { margin-bottom: 36px; }
        .form-intro h1 { font-family: var(--serif); font-size: 2.2rem; font-weight: 400; letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 10px; color: var(--ink); }
        .form-intro h1 em { font-style: italic; color: var(--ink); }
        .form-sub { font-size: 0.76rem; color: var(--ink-dim); }
        .field { margin-bottom: 32px; }
        label { display: block; font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-dim); margin-bottom: 12px; }
        .field-hint { font-size: 0.62rem; color: var(--accent); opacity: 0.8; margin-top: 6px; }
        .select-wrap { position: relative; }
        .select-arrow { position: absolute; right: 0; top: 50%; transform: translateY(-50%); color: var(--ink-dim); font-size: 0.72rem; pointer-events: none; }
        input, textarea, select { width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--border); color: var(--ink); font-family: var(--mono); font-size: 1rem; padding: 10px 0; outline: none; transition: border-color 0.2s; resize: none; appearance: none; -webkit-appearance: none; border-radius: 0; }
        input:focus, textarea:focus, select:focus { border-bottom-color: var(--accent); }
        input::placeholder, textarea::placeholder { color: var(--ink-dim); }
        select option { background: var(--surface); color: var(--ink); }
        .submit-btn { width: 100%; padding: 18px; margin-top: 8px; background: var(--accent-dim); border: 1px solid var(--accent); color: var(--accent); font-family: var(--mono); font-size: 0.82rem; letter-spacing: 0.18em; text-transform: uppercase; border-radius: var(--r); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background 0.2s, color 0.2s; }
        .submit-btn:active { background: var(--accent); color: var(--bg); }
        .error-msg { color: var(--red); font-size: 0.72rem; margin-bottom: 16px; }

        .song-strip { display: flex; align-items: center; gap: 14px; margin-top: 40px; padding: 16px; border: 1px solid var(--border); border-radius: var(--r); text-decoration: none; transition: border-color 0.2s; -webkit-tap-highlight-color: transparent; }
        .song-strip:active { border-color: var(--accent); }
        .song-icon { font-size: 1.2rem; color: var(--accent); opacity: 0.7; flex-shrink: 0; }
        .song-info { flex: 1; min-width: 0; }
        .song-label { font-size: 0.54rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-dim); margin-bottom: 3px; }
        .song-title { font-family: var(--serif); font-size: 0.95rem; font-style: italic; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .song-artist { font-size: 0.68rem; color: var(--ink-mid); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .song-arrow { font-size: 0.72rem; color: var(--ink-dim); flex-shrink: 0; }

        .loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 40dvh; gap: 24px; }
        .loading-label { font-family: var(--serif); font-size: 1.4rem; font-style: italic; opacity: 0.7; }
        .loading-dots { display: flex; gap: 8px; }
        .loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: blink 1.2s ease-in-out infinite; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,80%,100% { opacity: 0.15; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }

        .brief-view { display: flex; flex-direction: column; }
        .back-btn { background: none; border: none; color: var(--ink-dim); font-family: var(--mono); font-size: 0.72rem; cursor: pointer; padding: 0; margin-bottom: 24px; text-align: left; }
        .brief-chip-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .chip { font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); opacity: 0.85; }
        .chip-time { font-size: 0.62rem; color: var(--ink-dim); }
        .brief-who { font-family: var(--serif); font-size: 1.6rem; font-style: italic; letter-spacing: -0.01em; margin-bottom: 32px; line-height: 1.2; color: var(--ink); }
        .sections { display: flex; flex-direction: column; gap: 28px; margin-bottom: 40px; }
        .section { border-left: 2px solid var(--border); padding-left: 16px; }
        .section-label { font-size: 0.56rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; opacity: 0.85; }
        .section-body p { font-size: 0.9rem; line-height: 1.7; color: var(--ink); margin-bottom: 8px; }
        .print-btn { background: none; border: 1px solid var(--border); color: var(--ink-dim); font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.1em; padding: 10px 20px; border-radius: 20px; cursor: pointer; align-self: flex-end; }

        .history-head { margin-bottom: 24px; }
        .history-head h2 { font-family: var(--serif); font-size: 1.5rem; font-style: italic; margin-bottom: 8px; color: var(--ink); }
        .history-empty { font-size: 0.8rem; color: var(--ink-dim); }
        .history-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px; }
        .stat-box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 16px 12px; text-align: center; }
        .stat-num { font-family: var(--serif); font-size: 1.8rem; line-height: 1; margin-bottom: 4px; color: var(--ink); }
        .stat-label { font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-dim); }
        .history-list { display: flex; flex-direction: column; gap: 8px; }
        .history-item { display: flex; align-items: stretch; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; }
        .history-item.is-investor { background: #ede9e0; border-color: rgba(0,0,0,0.09); }
        .history-item.is-investor .history-who { color: #1a1a1a; }
        .history-item.is-investor .history-date { color: rgba(26,26,26,0.35); }
        .history-item.is-investor .history-type { color: #b8922a; }
        .history-item.is-update { background: #111827; border-color: rgba(100,140,255,0.15); }
        .history-item.is-update .history-who { color: #e4eaf8; }
        .history-item.is-update .history-date { color: rgba(228,234,248,0.35); }
        .history-item.is-update .history-type { color: #7b9cff; }
        .history-item-body { flex: 1; padding: 16px; cursor: pointer; text-align: left; background: none; border: none; -webkit-tap-highlight-color: transparent; }
        .history-item-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .history-who { font-size: 0.9rem; color: var(--ink); }
        .history-date { font-size: 0.62rem; color: var(--ink-dim); }
        .history-type { font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); opacity: 0.7; }
        .history-delete { background: none; border: none; border-left: 1px solid var(--border); color: var(--ink-dim); font-size: 1.1rem; padding: 0 16px; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color 0.2s; }
        .history-delete:active { color: var(--red); }

        @media print {
          body { background: white; color: black; }
          header, .back-btn, .print-btn, .mode-toggle-wrap, .date-line, .song-strip { display: none; }
          .section { border-left-color: #ccc; }
          .section-label { color: #666; }
        }
      `}</style>
    </>
  );
}