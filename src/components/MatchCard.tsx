import { Users } from "lucide-react";
import type { Match } from "@/lib/matches";
import { STATUS_LABEL, sportMeta } from "@/lib/matches";
import { cn } from "@/lib/utils";

const statusStyles: Record<Match["status"], string> = {
  scheduled: "bg-secondary text-secondary-foreground",
  live: "bg-success/15 text-success",
  finished: "bg-muted text-muted-foreground",
};

export function MatchCard({ match }: { match: Match }) {
  const meta = sportMeta(match.sport);

  return (
    <article
      className="surface-card group flex flex-col gap-4 rounded-2xl border border-border/70 p-4 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
      aria-label={`${match.home} contra ${match.away}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span aria-hidden className="text-base">
            {meta.emoji}
          </span>
          <span className="uppercase tracking-wide">{meta.label}</span>
          {match.competition && (
            <span className="truncate text-muted-foreground/70">· {match.competition}</span>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            statusStyles[match.status],
          )}
        >
          {match.status === "live" && (
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-success align-middle" />
          )}
          {STATUS_LABEL[match.status]}
        </span>
      </header>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{match.home}</p>
          <p className="truncate text-sm font-semibold text-foreground">{match.away}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tabular-nums text-gradient">{match.time ?? "--:--"}</p>
          <p className="text-xs text-muted-foreground">{match.date ?? "sem data"}</p>
        </div>
      </div>

      {match.metrics.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {match.metrics.map((m, i) => (
            <li
              key={`${m.label}-${i}`}
              className={cn(
                "rounded-lg border border-border/60 bg-secondary/60 px-2 py-1 text-[11px] text-secondary-foreground",
                m.inferred && "border-warning/50 text-warning",
              )}
              title={m.inferred ? "Campo inferido pela IA" : undefined}
            >
              <span className="text-muted-foreground">{m.label}</span>
              {m.value && <span className="ml-1 font-semibold">{m.value}</span>}
              {m.inferred && <span className="ml-1">·inferido</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-border/50 bg-background/40 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="size-3.5" aria-hidden /> Jogadores
        </p>
        {match.players.length === 0 ? (
          <p className="text-xs text-muted-foreground/70">Sem jogadores informados</p>
        ) : (
          <ul className="space-y-1">
            {match.players.map((p, i) => (
              <li key={`${p.name}-${i}`} className="flex justify-between gap-2 text-xs">
                <span className="truncate font-medium text-foreground">{p.name}</span>
                {p.stats && <span className="shrink-0 text-muted-foreground">{p.stats}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
