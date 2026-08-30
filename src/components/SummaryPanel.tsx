import type { Match } from "@/lib/matches";
import { SPORTS } from "@/lib/matches";

export function SummaryPanel({ matches }: { matches: Match[] }) {
  const upcoming = matches
    .filter((m) => m.status === "scheduled" && m.isoDate)
    .sort((a, b) => (a.isoDate ?? "").localeCompare(b.isoDate ?? ""))
    .slice(0, 3);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="surface-card rounded-2xl border border-border/60 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de jogos</p>
        <p className="mt-1 text-3xl font-bold text-gradient">{matches.length}</p>
      </div>

      <div className="surface-card rounded-2xl border border-border/60 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Por esporte</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {SPORTS.map((s) => {
            const count = matches.filter((m) => m.sport === s.id).length;
            if (!count) return null;
            return (
              <li
                key={s.id}
                className="rounded-lg bg-secondary/70 px-2 py-1 text-xs font-medium text-secondary-foreground"
              >
                <span aria-hidden>{s.emoji}</span> {s.label}: {count}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="surface-card rounded-2xl border border-border/60 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Próximos jogos</p>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground/70">Nenhum jogo agendado</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs">
            {upcoming.map((m) => (
              <li key={m.id} className="flex justify-between gap-2">
                <span className="truncate text-foreground">
                  {m.home} x {m.away}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {m.date} {m.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
