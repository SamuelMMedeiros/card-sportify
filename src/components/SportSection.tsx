import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Match, Sport } from "@/lib/matches";
import { sportMeta } from "@/lib/matches";
import { MatchCard } from "./MatchCard";
import { cn } from "@/lib/utils";

export function SportSection({ sport, matches }: { sport: Sport; matches: Match[] }) {
  const [open, setOpen] = useState(true);
  const meta = sportMeta(sport);

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-left transition-colors hover:border-primary/50"
      >
        <span aria-hidden className="text-xl">
          {meta.emoji}
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{meta.label}</h2>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary-glow">
          {matches.length} {matches.length === 1 ? "jogo" : "jogos"}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}
