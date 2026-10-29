import { Bridge } from "./types";
// Creative invitations, not assertions about a work's plot or a person's identity.
// Every proper title and catalog descriptor comes from the verified bridge.
export function planConnection(bridges: Bridge[]) {
  const questions = Array.from(
    { length: bridges.length ? 3 : 0 },
    (_, index) => {
      const b = bridges[index % bridges.length];
      const { entity: e } = b;
      const left = b.influences?.a[0]?.name;
      const right = b.influences?.b[0]?.name;
      const intro = left && right ? `Coming from ${left} and ${right}, ` : "";
      const cue = e.genres?.[0];
      if (index === 2 && left && right)
        return `You each get 30 seconds to introduce ${left} and ${right} to the other person. Then explore ${e.name}: what would make it a keeper for both of you?`;
      if (index === 2)
        return `Give ${e.name} a two-person audition. Each bring one detail from a favorite you already love: what would this new discovery have to offer to earn a second look from both of you?`;
      if (index === 1 && bridges.length === 1)
        return `After a first look at ${e.name}, each pitch it to the other in exactly seven words. Which word would you keep from each other’s pitch?`;
      switch (e.category) {
        case "artist":
          return `${intro ? intro[0].toUpperCase() + intro.slice(1) : ""}listen to a short preview by ${e.name}. Which moment would each of you steal for a shared road-trip playlist?`;
        case "book":
          return `Read the blurb for ${e.name} together${cue ? ` — Qloo lists it under ${cue}` : ""}. What one question would each of you need answered before turning the first page?`;
        case "movie":
          return `${cue ? `Qloo lists ${e.name} as ${cue}. ` : ""}Watch its trailer together${cue ? "" : ` for ${e.name}`}: would each of you be sold by the atmosphere, the characters, or the big idea? Defend your pick.`;
        case "tv_show":
          return `Give ${e.name} a one-episode audition${cue ? ` (Qloo’s catalog: ${cue})` : ""}. Before starting, what would each of you need from the opening scene to say “one more episode”?`;
        case "videogame":
          return `Watch a little gameplay from ${e.name}. If you played together, who would explore first and who would test the rules — and what might make you swap roles?`;
      }
    },
  );
  const first = bridges[0]?.entity;
  if (!first)
    return {
      questions,
      challenge:
        "Choose one favorite each. Take 6 minutes apiece to introduce it, then spend 3 minutes comparing what surprised you. No Qloo-supported bridge was found.",
    };
  const starts = {
    artist: `Listen to a preview by ${first.name}`,
    movie: `Watch the trailer for ${first.name}`,
    book: `Read the blurb or a short sample of ${first.name}`,
    tv_show: `Watch a trailer or preview for ${first.name}`,
    videogame: `Watch a gameplay preview of ${first.name}`,
  };
  return {
    questions,
    challenge: `0–3 min: ${starts[first.category]} together. 3–9 min: take 3 minutes each to point out one detail you loved or questioned. 9–13 min: each connect that detail to a favorite you brought today. 13–15 min: choose whether this becomes your next shared ${first.category === "artist" ? "listen" : first.category === "book" ? "read" : first.category === "videogame" ? "game" : "watch"}. You don’t need to know it already.`,
  };
}
