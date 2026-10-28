export const categories = [
  "movie",
  "artist",
  "book",
  "tv_show",
  "videogame",
] as const;
export type Category = (typeof categories)[number];
export const labels: Record<Category, string> = {
  movie: "Movies",
  artist: "Music",
  book: "Books",
  tv_show: "TV shows",
  videogame: "Games",
};
export type Entity = {
  id: string;
  name: string;
  category: Category;
  verification?: string;
};
export type Profile = { name: string; interests: Entity[] };
export type Bridge = {
  entity: Entity;
  rank: number;
  aRank: number | null;
  bRank: number | null;
  shared: boolean;
  reason: string;
  sources: { a: Entity[]; b: Entity[] };
};
export type Discovery = {
  mode: "live" | "fixture";
  bridges: Bridge[];
  trace: string[];
  warnings: string[];
  questions: string[];
  challenge: string;
};
