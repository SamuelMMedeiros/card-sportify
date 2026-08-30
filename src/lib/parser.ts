import type { Match, MatchStatus, Metric, PlayerEntry, Sport } from "./matches";
import { SPORT_METRIC_ORDER } from "./matches";

export interface ParseResult {
  matches: Match[];
  warnings: string[];
}

export class ParseError extends Error {}

const SPORT_BY_EMOJI: Record<string, Sport> = {
  "⚽": "futebol",
  "🏀": "basquete",
  "🏈": "futebol-americano",
  "⚾": "baseball",
  "⚾️": "baseball",
};

const SPORT_KEYWORDS: [RegExp, Sport][] = [
  [/futebol\s*americano|nfl|american\s*football/i, "futebol-americano"],
  [/basquete|basketball|nba|nbb/i, "basquete"],
  [/beis?ebol|baseball|mlb/i, "baseball"],
  [/futebol|soccer|brasileir|libertadores|premier\s*league|la\s*liga/i, "futebol"],
];

const METRIC_HINTS: [RegExp, Sport][] = [
  [/jarda|touchdown|turnover|sack|quarterback/i, "futebol-americano"],
  [/strikeout|home\s*run|\bhr\b|rebatedor|innings?|walks?|\bruns?\b/i, "baseball"],
  [/rebote|3pt|arremesso|assist[êe]ncia|cesta/i, "basquete"],
  [/escanteio|cart[õo]es|gols?|chutes?\s*(a|no)\s*gol|faltas/i, "futebol"],
];

function detectSportFromText(text: string): Sport | undefined {
  for (const [emoji, sport] of Object.entries(SPORT_BY_EMOJI)) {
    if (text.includes(emoji)) return sport;
  }
  for (const [re, sport] of SPORT_KEYWORDS) if (re.test(text)) return sport;
  return undefined;
}

function detectSportFromMetrics(blob: string): Sport | undefined {
  for (const [re, sport] of METRIC_HINTS) if (re.test(blob)) return sport;
  return undefined;
}

export function toIso(date?: string, time?: string): string | undefined {
  if (!date) return undefined;
  const m = date.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!m) return undefined;
  const [, d, mo, yRaw] = m;
  const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
  const [hh, mm] = (time ?? "00:00").split(":");
  const dt = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh ?? 0),
    Number(mm ?? 0),
  );
  return isNaN(dt.getTime()) ? undefined : dt.toISOString();
}

export function inferStatus(iso?: string, explicit?: string): MatchStatus {
  if (explicit) {
    const t = explicit.toLowerCase();
    if (/finaliz|encerrad|final|ft|finished/.test(t)) return "finished";
    if (/andamento|ao\s*vivo|live|1t|2t|intervalo/.test(t)) return "live";
    if (/iniciar|agendad|scheduled|breve/.test(t)) return "scheduled";
  }
  if (!iso) return "scheduled";
  const start = new Date(iso).getTime();
  const now = Date.now();
  if (now < start) return "scheduled";
  if (now < start + 3 * 60 * 60 * 1000) return "live";
  return "finished";
}

let counter = 0;
const nextId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;

const MATCH_LINE =
  /^\[?\s*(.+?)\s+(?:x|vs\.?|×|@)\s+(.+?)\s*(?:[-–—]\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}))?\s*(?:[-–—]\s*(\d{1,2}:\d{2}))?\s*\]?$/i;

function cleanLine(line: string) {
  return line
    .replace(/^\s*[#>*]+\s*/, "")
    .replace(/^\s*[-•·–]\s*/, "")
    .replace(/\*\*/g, "")
    .trim();
}

function isBullet(line: string) {
  return /^\s*([-•·*]|\d+\.)\s+/.test(line);
}

function parseMetric(text: string): Metric | undefined {
  const m = text.match(/^([^:]{1,40}):\s*(.+)$/);
  if (m) return { label: m[1].trim(), value: m[2].trim() };
  if (text.length > 0 && text.length < 60) return { label: text, value: "" };
  return undefined;
}

function normalizeSportMetrics(sport: Sport, metrics: Metric[]): Metric[] {
  const order = SPORT_METRIC_ORDER[sport];
  const rank = (m: Metric) => {
    const i = order.findIndex((o) => m.label.toLowerCase().includes(o));
    return i === -1 ? order.length : i;
  };
  return [...metrics].sort((a, b) => rank(a) - rank(b));
}

/** Parse the markdown / raw text format. */
export function parseText(input: string): ParseResult {
  const warnings: string[] = [];
  const lines = input.split(/\r?\n/);
  const matches: Match[] = [];

  let currentSport: Sport | undefined;
  let currentCompetition: string | undefined;
  let current: Match | undefined;
  let playersMode = false;

  const push = () => {
    if (current) {
      current.metrics = normalizeSportMetrics(current.sport, current.metrics);
      matches.push(current);
      current = undefined;
    }
    playersMode = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const bullet = isBullet(line);
    const content = cleanLine(line);
    if (!content) continue;

    // Heading (sport / competition)
    if (!bullet && /^#{1,6}\s/.test(line.trim())) {
      const sport = detectSportFromText(content);
      if (sport) {
        push();
        currentSport = sport;
        currentCompetition = content
          .replace(/[⚽🏀🏈⚾️]/g, "")
          .replace(/^(futebol americano|futebol|basquete|baseball|beisebol)\s*[-–—:]?\s*/i, "")
          .trim();
        if (!currentCompetition) currentCompetition = undefined;
        continue;
      }
      currentCompetition = content.replace(/[⚽🏀🏈⚾️]/g, "").trim() || undefined;
      continue;
    }

    // Non-bullet line that is only a sport marker
    if (!bullet && /^[⚽🏀🏈⚾️]/.test(content) && !MATCH_LINE.test(content.replace(/[⚽🏀🏈⚾️]/g, "").trim())) {
      push();
      currentSport = detectSportFromText(content) ?? currentSport;
      const rest = content.replace(/[⚽🏀🏈⚾️]/g, "").trim();
      currentCompetition = rest || undefined;
      continue;
    }

    const stripped = content.replace(/[⚽🏀🏈⚾️]/g, "").trim();

    // Players section header
    if (/^(jogadores|players|destaques|atletas)\s*:?\s*$/i.test(stripped)) {
      playersMode = true;
      continue;
    }

    const mm = stripped.match(MATCH_LINE);
    const looksLikeMatch = !!mm && !!mm[1] && !!mm[2] && (!!mm[3] || !!mm[4] || !bullet);

    if (looksLikeMatch && mm) {
      push();
      const inline = detectSportFromText(content);
      const sport = inline ?? currentSport ?? "futebol";
      const date = mm[3];
      const time = mm[4];
      const iso = toIso(date, time);
      current = {
        id: nextId(),
        sport,
        home: mm[1].trim(),
        away: mm[2].trim(),
        competition: currentCompetition,
        date,
        time,
        isoDate: iso,
        status: inferStatus(iso),
        metrics: [],
        players: [],
      };
      continue;
    }

    if (!current) {
      // Free text before any match: might set sport context
      const sport = detectSportFromText(stripped);
      if (sport) currentSport = sport;
      continue;
    }

    if (playersMode || /^jogador(es)?\s*[:-]/i.test(stripped)) {
      const text = stripped.replace(/^jogador(es)?\s*[:-]\s*/i, "");
      const parts = text.split(/\s*[-–—]\s*|\s*\|\s*/);
      const entry: PlayerEntry = { name: parts[0].trim() };
      if (parts.length > 1) entry.stats = parts.slice(1).join(" · ").trim();
      if (entry.name) current.players.push(entry);
      continue;
    }

    const metric = parseMetric(stripped);
    if (metric) {
      current.metrics.push(metric);
      if (!detectSportFromText(stripped)) {
        const hinted = detectSportFromMetrics(stripped);
        if (hinted && !currentSport) current.sport = hinted;
      }
    }
  }

  push();

  if (matches.length === 0) {
    throw new ParseError(
      "Nenhuma partida reconhecida. Use o formato [Time A x Time B - DD/MM/YYYY - HH:MM] ou cole um JSON válido.",
    );
  }

  for (const m of matches) {
    if (!m.date) warnings.push(`Sem data definida: ${m.home} x ${m.away}`);
  }

  return { matches, warnings };
}

interface RawJsonMatch {
  sport?: string;
  esporte?: string;
  home?: string;
  away?: string;
  teams?: { home?: string; away?: string } | string[];
  timeA?: string;
  timeB?: string;
  competition?: string;
  competicao?: string;
  date?: string;
  data?: string;
  time?: string;
  hora?: string;
  status?: string;
  metrics?: unknown;
  metricas?: unknown;
  players?: unknown;
  jogadores?: unknown;
}

function coerceSport(value: unknown, fallbackBlob: string): Sport {
  const text = typeof value === "string" ? value : "";
  return (
    detectSportFromText(text) ??
    detectSportFromText(fallbackBlob) ??
    detectSportFromMetrics(fallbackBlob) ??
    "futebol"
  );
}

function coerceMetrics(value: unknown): Metric[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v): Metric | undefined => {
        if (typeof v === "string") return parseMetric(v);
        if (v && typeof v === "object") {
          const o = v as Record<string, unknown>;
          const label = String(o.label ?? o.nome ?? o.key ?? "").trim();
          if (!label) return undefined;
          return {
            label,
            value: String(o.value ?? o.valor ?? ""),
            inferred: Boolean(o.inferred ?? o.inferido),
          };
        }
        return undefined;
      })
      .filter((x): x is Metric => !!x);
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([label, v]) => ({
      label,
      value: String(v ?? ""),
    }));
  }
  return [];
}

function coercePlayers(value: unknown): PlayerEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v): PlayerEntry | undefined => {
      if (typeof v === "string") return { name: v };
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        const name = String(o.name ?? o.nome ?? "").trim();
        if (!name) return undefined;
        const stats =
          typeof o.stats === "string"
            ? o.stats
            : o.stats && typeof o.stats === "object"
              ? Object.entries(o.stats as Record<string, unknown>)
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(" · ")
              : typeof o.estatisticas === "string"
                ? o.estatisticas
                : undefined;
        return { name, team: o.team ? String(o.team) : undefined, stats };
      }
      return undefined;
    })
    .filter((x): x is PlayerEntry => !!x);
}

export function parseJson(input: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    throw new ParseError(
      `JSON inválido: ${(e as Error).message}. Verifique vírgulas, aspas e chaves.`,
    );
  }

  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { matches?: unknown }).matches)
      ? (data as { matches: unknown[] }).matches
      : data && typeof data === "object" && Array.isArray((data as { partidas?: unknown }).partidas)
        ? (data as { partidas: unknown[] }).partidas
        : undefined;

  if (!list) {
    throw new ParseError(
      'JSON válido, mas sem lista de partidas. Envie um array ou um objeto { "matches": [...] }.',
    );
  }

  const warnings: string[] = [];
  const matches: Match[] = [];

  list.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      warnings.push(`Item ${index + 1} ignorado: não é um objeto.`);
      return;
    }
    const o = item as RawJsonMatch;
    const teams = o.teams;
    const home =
      o.home ??
      o.timeA ??
      (Array.isArray(teams) ? teams[0] : teams?.home) ??
      "";
    const away =
      o.away ??
      o.timeB ??
      (Array.isArray(teams) ? teams[1] : teams?.away) ??
      "";
    if (!home || !away) {
      warnings.push(`Item ${index + 1} ignorado: times ausentes (home/away).`);
      return;
    }
    const metrics = coerceMetrics(o.metrics ?? o.metricas);
    const players = coercePlayers(o.players ?? o.jogadores);
    const blob = JSON.stringify(item);
    const sport = coerceSport(o.sport ?? o.esporte, blob);
    const date = o.date ?? o.data;
    const time = o.time ?? o.hora;
    const iso = toIso(date, time);
    matches.push({
      id: nextId(),
      sport,
      home: String(home).trim(),
      away: String(away).trim(),
      competition: o.competition ?? o.competicao,
      date,
      time,
      isoDate: iso,
      status: inferStatus(iso, o.status),
      metrics: normalizeSportMetrics(sport, metrics),
      players,
    });
  });

  if (matches.length === 0) {
    throw new ParseError("Nenhuma partida válida encontrada no JSON.");
  }

  return { matches, warnings };
}

export function parseInput(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) throw new ParseError("Cole os dados das partidas para gerar os cards.");
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return parseJson(trimmed);
    } catch (e) {
      // A markdown list can also start with "[" — fall back to text parsing.
      try {
        return parseText(trimmed);
      } catch {
        throw e;
      }
    }
  }
  return parseText(trimmed);
}
