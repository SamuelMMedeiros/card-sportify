import { Search } from "lucide-react";
import { SPORTS, STATUS_LABEL, type MatchStatus, type Sport } from "@/lib/matches";
import { cn } from "@/lib/utils";

export type SportFilter = Sport | "all";
export type StatusFilter = MatchStatus | "all";
export type SortMode = "time" | "name";

interface Props {
  query: string;
  onQuery: (v: string) => void;
  sport: SportFilter;
  onSport: (v: SportFilter) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  sort: SortMode;
  onSort: (v: SortMode) => void;
  counts: Record<SportFilter, number>;
}

export function FiltersBar({
  query,
  onQuery,
  sport,
  onSport,
  status,
  onStatus,
  sort,
  onSort,
  counts,
}: Props) {
  const options: { id: SportFilter; label: string; emoji?: string }[] = [
    { id: "all", label: "Todos" },
    ...SPORTS.map((s) => ({ id: s.id as SportFilter, label: s.label, emoji: s.emoji })),
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar por time, jogador, competição ou métrica…"
          aria-label="Buscar partidas"
          className="h-11 w-full rounded-xl border border-border bg-card/70 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onSport(o.id)}
            aria-pressed={sport === o.id}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              sport === o.id
                ? "border-primary/60 bg-primary/20 text-primary-glow"
                : "border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {o.emoji && <span aria-hidden>{o.emoji} </span>}
            {o.label}
            <span className="ml-1.5 opacity-70">{counts[o.id] ?? 0}</span>
          </button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="status-filter">
            Filtrar por status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => onStatus(e.target.value as StatusFilter)}
            className="h-9 rounded-lg border border-border bg-card/70 px-2 text-xs text-foreground outline-none focus-visible:border-primary"
          >
            <option value="all">Todos os status</option>
            {(Object.keys(STATUS_LABEL) as MatchStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="sort-mode">
            Ordenar
          </label>
          <select
            id="sort-mode"
            value={sort}
            onChange={(e) => onSort(e.target.value as SortMode)}
            className="h-9 rounded-lg border border-border bg-card/70 px-2 text-xs text-foreground outline-none focus-visible:border-primary"
          >
            <option value="time">Ordenar por horário</option>
            <option value="name">Ordenar por nome</option>
          </select>
        </div>
      </div>
    </div>
  );
}
