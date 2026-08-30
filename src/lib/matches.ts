export type Sport = "futebol" | "basquete" | "futebol-americano" | "baseball";

export type MatchStatus = "scheduled" | "live" | "finished";

export interface Metric {
  label: string;
  value: string;
  inferred?: boolean | undefined;
}

export interface PlayerEntry {
  name: string;
  team?: string | undefined;
  stats?: string | undefined;
}

export interface Match {
  id: string;
  sport: Sport;
  home: string;
  away: string;
  competition?: string | undefined;
  date?: string | undefined; // DD/MM/YYYY
  time?: string | undefined; // HH:MM
  isoDate?: string | undefined; // ISO string when computable
  status: MatchStatus;
  metrics: Metric[];
  players: PlayerEntry[];
}

export const SPORTS: { id: Sport; label: string; emoji: string }[] = [
  { id: "futebol", label: "Futebol", emoji: "⚽" },
  { id: "basquete", label: "Basquete", emoji: "🏀" },
  { id: "futebol-americano", label: "Futebol Americano", emoji: "🏈" },
  { id: "baseball", label: "Baseball", emoji: "⚾" },
];

export const sportMeta = (s: Sport) => SPORTS.find((x) => x.id === s)!;

export const STATUS_LABEL: Record<MatchStatus, string> = {
  scheduled: "A iniciar",
  live: "Em andamento",
  finished: "Finalizado",
};

/** Metric labels considered relevant per sport (used to order/normalize chips). */
export const SPORT_METRIC_ORDER: Record<Sport, string[]> = {
  futebol: ["gols", "cartões", "escanteios", "chutes no gol", "faltas", "posse"],
  basquete: ["pontos", "rebotes", "3pt", "assistências", "faltas"],
  "futebol-americano": ["pontos", "jardas", "touchdowns", "turnovers", "sacks"],
  baseball: ["runs", "strikeouts", "hits", "hr", "walks", "roubos"],
};
