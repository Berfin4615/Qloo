"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  AudioLines,
  Film,
  BookOpen,
  Gamepad2,
  Tv,
  X,
  Plus,
  Shuffle,
  Check,
  Compass,
  Heart,
  RotateCcw,
  Network,
  ShieldCheck,
} from "lucide-react";
import {
  categories,
  Category,
  Discovery,
  Entity,
  labels,
  Profile,
} from "@/lib/types";
const icons = {
  movie: Film,
  artist: AudioLines,
  book: BookOpen,
  tv_show: Tv,
  videogame: Gamepad2,
};
const stages = [
  "Reading cultural preferences",
  "Finding cultural associations",
  "Discovering shared connections",
  "Creating interaction ideas",
];
function Constellation({
  profiles,
  bridges,
  onSelect,
}: {
  profiles?: Profile[];
  bridges?: Entity[];
  onSelect?: (id: string) => void;
}) {
  const left = profiles?.[0].interests.slice(0, 3).map((e) => e.name) ?? [
    "Interstellar",
    "Radiohead",
    "Dune",
  ];
  const right = profiles?.[1].interests.slice(0, 3).map((e) => e.name) ?? [
    "Spider-Verse",
    "Daft Punk",
    "The Hobbit",
  ];
  return (
    <div className="constellation">
      <div className="orbit o1" />
      <div className="orbit o2" />
      <svg viewBox="0 0 640 420" aria-hidden="true">
        <defs>
          <linearGradient id="line">
            <stop stopColor="#ae98ff" />
            <stop offset="1" stopColor="#65e4d9" />
          </linearGradient>
        </defs>
        {[95, 210, 325].map((y, i) => (
          <g key={y}>
            <path
              d={`M 145 ${y} Q 280 ${y} 320 210 Q 370 ${y} 495 ${y}`}
              stroke="url(#line)"
              fill="none"
              opacity={0.25 + i * 0.15}
            />
            <circle cx="145" cy={y} r="4" fill="#b6a2ff" />
            <circle cx="495" cy={y} r="4" fill="#6ee6d6" />
          </g>
        ))}
      </svg>
      <div className="nodes left">
        {left.map((n, i) => (
          <span key={n}>
            <i>{["✦", "♫", "▤"][i]}</i>
            {n}
          </span>
        ))}
      </div>
      <div className="nodes right">
        {right.map((n, i) => (
          <span key={n}>
            <i>{["✦", "♫", "▤"][i]}</i>
            {n}
          </span>
        ))}
      </div>
      <button
        className="core"
        aria-label="Inspect cultural bridge"
        onClick={() => onSelect?.(bridges?.[0]?.id ?? "")}
      >
        <Network size={34} />
      </button>
      <div className="map-caption">
        {bridges?.[0]?.name ?? "A world of possible connections"}
        <small>
          {bridges
            ? "Your shared discovery"
            : "Different tastes. Unexpected possibilities."}
        </small>
      </div>
      <span className="person a">{profiles?.[0].name || "YOUR WORLD"}</span>
      <span className="person b">{profiles?.[1].name || "THEIR WORLD"}</span>
    </div>
  );
}
function ProfileEditor({
  index,
  profile,
  onChange,
  mode,
}: {
  index: number;
  profile: Profile;
  onChange: (p: Profile) => void;
  mode: string;
}) {
  const [category, setCategory] = useState<Category>("movie");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entity[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setResults([]);
    if (query.trim().length < 2) {
      setBusy(false);
      return;
    }
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&category=${category}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResults(data.results);
        setError("");
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, category]);
  return (
    <section className={`profile profile-${index}`}>
      <div className="profile-heading">
        <span className="avatar">{index === 0 ? "A" : "B"}</span>
        <div>
          <span className="eyebrow">PERSON {index === 0 ? "ONE" : "TWO"}</span>
          <h3>
            {index === 0 ? "Your little universe" : "Their little universe"}
          </h3>
        </div>
        <span className="count">{profile.interests.length}/12</span>
      </div>
      <label className="field-label" htmlFor={`name-${index}`}>
        Display name <span>optional</span>
      </label>
      <input
        id={`name-${index}`}
        placeholder={index === 0 ? "e.g. Alex" : "e.g. Sam"}
        value={profile.name}
        maxLength={40}
        onChange={(e) => onChange({ ...profile, name: e.target.value })}
      />
      <label className="field-label">What do you keep coming back to?</label>
      <div className="categories">
        {categories.map((c) => {
          const Icon = icons[c];
          return (
            <button
              key={c}
              className={category === c ? "active" : ""}
              onClick={() => {
                setCategory(c);
                setQuery("");
              }}
              aria-label={labels[c]}
              title={labels[c]}
            >
              <Icon size={17} />
              <span>{labels[c]}</span>
            </button>
          );
        })}
      </div>
      <div className="search-wrap">
        <input
          aria-label={`Search ${labels[category]} for person ${index + 1}`}
          placeholder={`Search ${labels[category].toLowerCase()}…`}
          value={query}
          maxLength={100}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Plus size={18} />
      </div>
      <div className="search-results" aria-live="polite">
        {busy && (
          <p>Searching {mode === "live" ? "Qloo" : "offline examples"}…</p>
        )}
        {error && <p className="error">{error}</p>}
        {query.length >= 2 && !busy && !error && !results.length && (
          <p>No matches. Try another title.</p>
        )}
        {results
          .filter((e) => !profile.interests.some((i) => i.id === e.id))
          .map((e) => (
            <button
              key={e.id}
              disabled={profile.interests.length >= 12}
              onClick={() => {
                onChange({ ...profile, interests: [...profile.interests, e] });
                setQuery("");
              }}
            >
              {e.name}
              <Plus size={15} />
            </button>
          ))}
      </div>
      <div className="chips">
        {profile.interests.map((e) => {
          const Icon = icons[e.category];
          return (
            <span key={e.id}>
              <Icon size={13} />
              {e.name}
              <button
                aria-label={`Remove ${e.name}`}
                onClick={() =>
                  onChange({
                    ...profile,
                    interests: profile.interests.filter((i) => i.id !== e.id),
                  })
                }
              >
                <X size={13} />
              </button>
            </span>
          );
        })}
      </div>
      <small className="hint">
        {profile.interests.length < 3
          ? `Add ${3 - profile.interests.length} more favorites to get started.`
          : "A lovely starting point. Add more, or explore."}
      </small>
    </section>
  );
}
export default function Home() {
  const [mode, setMode] = useState("loading");
  const [profiles, setProfiles] = useState<[Profile, Profile]>([
    { name: "", interests: [] },
    { name: "", interests: [] },
  ]);
  const [result, setResult] = useState<Discovery | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [liked, setLiked] = useState<Entity[]>([]);
  const [category, setCategory] = useState<Category | undefined>();
  const [selected, setSelected] = useState("");
  const [consent, setConsent] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setMode(d.mode))
      .catch(() => setMode("unavailable"));
  }, []);
  const scroll = () =>
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
  async function demo() {
    setDemoBusy(true);
    setError("");
    scroll();
    try {
      const seeds: [string, Category][][] = [
        [
          ["Interstellar", "movie"],
          ["Radiohead", "artist"],
          ["Dune", "book"],
        ],
        [
          ["Spider-Man: Into the Spider-Verse", "movie"],
          ["Daft Punk", "artist"],
          ["The Hobbit", "book"],
        ],
      ];
      const resolved = await Promise.all(
        seeds.map(async (list, index) => ({
          name: index === 0 ? "Alex" : "Sam",
          interests: await Promise.all(
            list.map(async ([name, c]) => {
              const r = await fetch(
                `/api/search?q=${encodeURIComponent(name)}&category=${c}`,
              );
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              const exact = d.results.find(
                (e: Entity) => e.name.toLowerCase() === name.toLowerCase(),
              );
              if (!exact)
                throw new Error(
                  `Could not unambiguously resolve ${name}. Please select the intended result manually.`,
                );
              return exact;
            }),
          ),
        })),
      );
      setProfiles(resolved as [Profile, Profile]);
      setResult(null);
      setExcluded([]);
      setLiked([]);
      setCategory(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load demo.");
    } finally {
      setDemoBusy(false);
    }
  }
  async function discover(
    options: {
      exclude?: string[];
      like?: Entity[];
      cat?: Category;
      surprise?: boolean;
    } = {},
  ) {
    setLoading(true);
    setError("");
    setStage(-1);
    const ex = options.exclude ?? excluded;
    const likes = options.like ?? liked;
    const cat = options.cat ?? category;
    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profiles,
          excluded: ex,
          liked: likes,
          category: cat,
          surprise: options.surprise ?? false,
        }),
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error);
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split("\n");
        pending = lines.pop()!;
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.error) throw new Error(event.error);
          if (event.stage !== undefined) setStage(event.stage);
          if (event.result) {
            setResult(event.result);
            setSelected(event.result.bridges[0]?.entity.id ?? "");
            setExcluded(ex);
            setLiked(likes);
            setCategory(cat);
            setTimeout(
              () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
              50,
            );
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed.");
    } finally {
      setLoading(false);
    }
  }
  const focus =
    result?.bridges.find((b) => b.entity.id === selected) ?? result?.bridges[0];
  return (
    <>
      <header className="nav container">
        <a className="brand" href="#">
          <span>
            <Network size={22} />
          </span>
          common<span className="brand-light">ground</span>
          <sup>AI</sup>
        </a>
        <nav>
          <a href="#how">How it works</a>
          <a href="#discover">Explore together</a>
          <span className="nav-note">
            <span />
            Built for human connection
          </span>
        </nav>
      </header>
      <main>
        <section className="hero container">
          <div className="hero-copy">
            <div className="pill">
              <span />A LITTLE LESS STRANGERS.
            </div>
            <h1>
              You have more
              <br />
              in common
              <br />
              than you <em>think.</em>
            </h1>
            <p>
              Discover the unexpected connections hiding between your favorite
              movies, music, books, and more.
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={scroll}>
                Find Our Common Ground <ArrowRight size={18} />
              </button>
              <button
                className="text-button"
                onClick={demo}
                disabled={demoBusy}
              >
                Try Demo <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="hero-foot">
              <span className="mini-avatars">
                <i>A</i>
                <i>B</i>
              </span>
              <span>
                Two people. A whole world in between.
                <br />
                <b>No accounts. Just curiosity.</b>
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-top">
              <span className="eyebrow">THE CONNECTION CONSTELLATION</span>
              <span className="tiny-pill">✦ POSSIBILITIES</span>
            </div>
            <Constellation onSelect={scroll} />
            <div className="visual-bottom">
              <span>
                <i className="dot violet" />
                Your interests
              </span>
              <span>
                <i className="dot cyan" />
                Their interests
              </span>
              <span>
                One shared discovery <Sparkles size={12} />
              </span>
            </div>
          </div>
        </section>
        <section className="strip">
          <div className="container">
            <span>DIFFERENT WORLDS. SHARED POSSIBILITIES.</span>
            {categories.map((c) => {
              const Icon = icons[c];
              return (
                <span key={c}>
                  <Icon size={18} />
                  {labels[c]}
                </span>
              );
            })}
          </div>
        </section>
        <section className="intro container" id="how">
          <div>
            <span className="eyebrow">
              CURIOSITY, MEET CULTURAL INTELLIGENCE
            </span>
            <h2>
              Skip the small talk.
              <br />
              Find the <em>good stuff.</em>
            </h2>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Bring your favorites",
                "A few things you love. A glimpse into your world.",
              ],
              [
                "02",
                "Follow the connections",
                "Qloo explores cultural associations for each of you.",
              ],
              [
                "03",
                "Make a little connection",
                "Leave with something to explore, ask, or try together.",
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="discovery container" id="discover">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TWO WORLDS. ONE STARTING POINT.</span>
              <h2>Let’s find your common ground.</h2>
              <p>
                Bring at least 3 favorites each. The more you share, the more
                there is to explore.
              </p>
            </div>
            <button
              className="outline"
              onClick={demo}
              disabled={loading || demoBusy}
            >
              <Sparkles size={15} />
              {demoBusy ? "Finding demo favorites…" : "Fill with demo profiles"}
            </button>
          </div>
          <div className={`mode-banner ${mode === "live" ? "live" : ""}`}>
            <ShieldCheck size={17} />
            {mode === "fixture"
              ? "Offline preview · Synthetic example associations, not live Qloo results."
              : mode === "live"
                ? "Live Qloo mode · Cultural research happens securely on the server."
                : mode === "loading"
                  ? "Checking connection…"
                  : "Connection unavailable. Please reload."}
          </div>
          <div className="profile-grid">
            {profiles.map((p, i) => (
              <ProfileEditor
                key={i}
                index={i}
                profile={p}
                mode={mode}
                onChange={(p) => {
                  setProfiles((old) => (i === 0 ? [p, old[1]] : [old[0], p]));
                  setResult(null);
                  setExcluded([]);
                  setLiked([]);
                  setCategory(undefined);
                }}
              />
            ))}
          </div>
          <div className="launch">
            <label>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />{" "}
              We both agree to explore using these interests.
            </label>
            <button
              className="primary"
              disabled={
                !consent ||
                profiles.some((p) => p.interests.length < 3) ||
                loading ||
                demoBusy
              }
              onClick={() => discover()}
            >
              <Sparkles size={18} />
              {loading ? "Exploring your worlds…" : "Discover our connections"}
              <ArrowRight size={17} />
            </button>
            <small>
              Profiles stay in this session. Interest IDs are sent to Qloo for
              research.
            </small>
          </div>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          {loading && (
            <div className="progress" role="status">
              {stages.map((s, i) => (
                <span className={i <= stage ? "done" : ""} key={s}>
                  {i < stage ? (
                    <Check size={15} />
                  ) : (
                    <span className={i === stage ? "spinner" : "stage-dot"} />
                  )}{" "}
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>
        {result && (
          <section className="results container" ref={resultsRef}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  A LITTLE DISCOVERY. A NEW BEGINNING.
                </span>
                <h2>
                  {result.bridges.length
                    ? "Your worlds just got a little closer."
                    : "The search is part of the story."}
                </h2>
                <p>
                  {result.mode === "fixture"
                    ? "Offline preview — every association below is synthetic."
                    : "Grounded in separate Qloo result sets. No compatibility percentages."}
                </p>
              </div>
              <button
                className="outline"
                disabled={loading}
                onClick={() =>
                  discover({
                    exclude: [
                      ...excluded,
                      ...result.bridges.map((b) => b.entity.id),
                    ],
                    surprise: true,
                  })
                }
              >
                <Shuffle size={16} />
                Surprise us
              </button>
            </div>
            {result.warnings.map((w) => (
              <p className="mode-banner" key={w}>
                {w}
              </p>
            ))}
            {focus ? (
              <>
                <div className="bridge-grid">
                  <div className="bridge-map">
                    <Constellation
                      profiles={profiles}
                      bridges={[focus.entity]}
                      onSelect={() =>
                        document
                          .getElementById("bridge-evidence")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    />
                  </div>
                  <article className="bridge-feature" id="bridge-evidence">
                    <span className="eyebrow">
                      {focus.shared
                        ? "YOUR SHARED FAVORITE"
                        : "THE CULTURAL BRIDGE"}{" "}
                      · {labels[focus.entity.category]}
                    </span>
                    <h2>{focus.entity.name}</h2>
                    <p>
                      {result.mode === "fixture"
                        ? "Synthetic example: this illustrates how an overlapping recommendation would be presented."
                        : focus.reason}
                    </p>
                    <div className="evidence">
                      <span>
                        {profiles[0].name || "Person A"} →{" "}
                        {focus.aRank
                          ? `result #${focus.aRank}`
                          : "selected favorite"}
                      </span>
                      <Network size={18} />
                      <span>
                        {profiles[1].name || "Person B"} →{" "}
                        {focus.bRank
                          ? `result #${focus.bRank}`
                          : "selected favorite"}
                      </span>
                    </div>
                    <details>
                      <summary>How we found this connection</summary>
                      <p>{focus.reason}</p>
                      <p>
                        Profile A research inputs:{" "}
                        {focus.sources.a.map((e) => e.name).join(", ")}.
                      </p>
                      <p>
                        Profile B research inputs:{" "}
                        {focus.sources.b.map((e) => e.name).join(", ")}.
                      </p>
                      <p>
                        Inputs are profile-level evidence; no individual
                        favorite-to-result relationship is asserted. Ranking
                        uses reciprocal result positions and category diversity,
                        not a Qloo compatibility score.
                      </p>
                    </details>
                  </article>
                </div>
                <div className="section-heading small">
                  <h3>Unexpected places to meet.</h3>
                  <label className="category-select">
                    Try another category{" "}
                    <select
                      aria-label="Try another category"
                      value={category ?? ""}
                      disabled={loading}
                      onChange={(e) =>
                        discover({ cat: e.target.value as Category })
                      }
                    >
                      <option value="" disabled>
                        Choose a world
                      </option>
                      {categories.map((c) => (
                        <option value={c} key={c}>
                          {labels[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="cards">
                  {result.bridges.map((b, i) => {
                    const Icon = icons[b.entity.category];
                    return (
                      <article
                        className={`result-card ${selected === b.entity.id ? "selected" : ""}`}
                        key={b.entity.id}
                      >
                        <div className="card-top">
                          <Icon size={21} />
                          <span>
                            0{i + 1} / {labels[b.entity.category]}
                          </span>
                        </div>
                        <button
                          className="card-title"
                          onClick={() => setSelected(b.entity.id)}
                        >
                          {b.entity.name}
                          <ArrowUpRight size={19} />
                        </button>
                        <p>
                          {b.shared
                            ? "A favorite you already share."
                            : result.mode === "fixture"
                              ? "Synthetic overlapping recommendation."
                              : "Appeared independently in research for both of you."}
                        </p>
                        <small>
                          Explore this together and compare your first
                          impressions.
                        </small>
                        <div className="feedback">
                          <button
                            disabled={loading || liked.length >= 10}
                            onClick={() =>
                              discover({
                                like: [
                                  ...liked.filter((e) => e.id !== b.entity.id),
                                  b.entity,
                                ],
                                exclude: [...excluded, b.entity.id],
                              })
                            }
                          >
                            <Heart size={13} />
                            More like this
                          </button>
                          <button
                            disabled={loading}
                            onClick={() =>
                              discover({ exclude: [...excluded, b.entity.id] })
                            }
                          >
                            <X size={13} />
                            Not our vibe
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="takeaway-grid">
                  <section className="questions">
                    <span className="eyebrow">LESS “SO, WHAT DO YOU DO?”</span>
                    <h3>A conversation worth starting.</h3>
                    {result.questions.map((q, i) => (
                      <p key={q}>
                        <span>0{i + 1}</span>
                        {q}
                      </p>
                    ))}
                  </section>
                  <section className="challenge">
                    <span className="challenge-icon">
                      <Compass size={30} />
                    </span>
                    <span className="eyebrow">
                      THE 15-MINUTE CONNECTION CHALLENGE
                    </span>
                    <h3>
                      A tiny adventure.
                      <br />
                      Just the two of you.
                    </h3>
                    <p>{result.challenge}</p>
                    <span className="tiny-pill">
                      15 MIN · NO PREPARATION NEEDED
                    </span>
                  </section>
                </div>
              </>
            ) : (
              <div className="empty">
                <Compass size={36} />
                <h3>No supported bridge found this time.</h3>
                <p>
                  Different tastes are a conversation, too. Add a few more
                  favorites or explore a different category.
                </p>
                <button className="outline" onClick={scroll}>
                  <RotateCcw size={15} />
                  Adjust your favorites
                </button>
              </div>
            )}
            <details className="agent-log">
              <summary>
                Inside the discovery agent · {result.trace.length} completed
                steps
              </summary>
              {result.trace.map((t, i) => (
                <p key={t}>
                  <b>0{i + 1}</b> {t}
                </p>
              ))}
            </details>
          </section>
        )}
      </main>
      <footer className="container">
        <a className="brand" href="#">
          <Network size={21} />
          commonground<sup>AI</sup>
        </a>
        <span>Less time searching. More time connecting.</span>
        <small>
          Built with Qloo cultural intelligence · No account required
        </small>
      </footer>
    </>
  );
}
