import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { InputPanel } from "@/components/InputPanel";
import { FiltersBar, type SortMode, type SportFilter, type StatusFilter } from "@/components/FiltersBar";
import { SummaryPanel } from "@/components/SummaryPanel";
import { SportSection } from "@/components/SportSection";
import { SPORTS, type Match, type Sport } from "@/lib/matches";
import { ParseError, parseInput } from "@/lib/parser";
import { SAMPLE_INPUT } from "@/lib/sample";
import { enhanceMatches } from "@/lib/ai.functions";

const STORAGE_KEY = "sportcards:v1";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SportCards — Gere cards de partidas a partir de texto ou JSON" },
      {
        name: "description",
        content:
          "Cole dados de partidas em RAW, Markdown ou JSON e gere cards esportivos organizados por futebol, basquete, futebol americano e baseball.",
      },
      { property: "og:title", content: "SportCards — Cards de partidas esportivas" },
      {
        property: "og:description",
        content: "Transforme texto ou JSON de partidas em cards premium com busca, filtros e exportação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function matchBlob(m: Match) {
  return [
    m.home,
    m.away,
    m.competition ?? "",
    m.date ?? "",
    m.time ?? "",
    ...m.metrics.map((x) => `${x.label} ${x.value}`),
    ...m.players.map((p) => `${p.name} ${p.stats ?? ""}`),
  ]
    .join(" ")
    .toLowerCase();
}

function Index() {
  const [input, setInput] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<SportFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("time");
  const [enhancing, setEnhancing] = useState(false);

  const enhance = useServerFn(enhanceMatches);

  // Restore from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { matches: Match[]; input?: string };
        if (Array.isArray(saved.matches) && saved.matches.length) {
          setMatches(saved.matches);
          setInput(saved.input ?? "");
        }
      }
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (matches) localStorage.setItem(STORAGE_KEY, JSON.stringify({ matches, input }));
    else localStorage.removeItem(STORAGE_KEY);
  }, [matches, input, hydrated]);

  const generate = useCallback(() => {
    setLoading(true);
    setError(null);
    // Let the loading state paint before parsing.
    setTimeout(() => {
      try {
        const result = parseInput(input);
        setMatches(result.matches);
        toast.success(`${result.matches.length} partidas encontradas`);
        if (result.warnings.length) toast.warning(result.warnings[0]!);
      } catch (e) {
        setMatches(null);
        setError(e instanceof ParseError ? e.message : "Não foi possível interpretar os dados.");
      } finally {
        setLoading(false);
      }
    }, 120);
  }, [input]);

  const filtered = useMemo(() => {
    if (!matches) return [];
    const q = query.trim().toLowerCase();
    return matches
      .filter((m) => (sport === "all" ? true : m.sport === sport))
      .filter((m) => (status === "all" ? true : m.status === status))
      .filter((m) => (q ? matchBlob(m).includes(q) : true))
      .sort((a, b) =>
        sort === "name"
          ? `${a.home} ${a.away}`.localeCompare(`${b.home} ${b.away}`)
          : (a.isoDate ?? "9999").localeCompare(b.isoDate ?? "9999"),
      );
  }, [matches, query, sport, status, sort]);

  const counts = useMemo(() => {
    const base = { all: matches?.length ?? 0 } as Record<SportFilter, number>;
    for (const s of SPORTS) base[s.id] = matches?.filter((m) => m.sport === s.id).length ?? 0;
    return base;
  }, [matches]);

  const grouped = useMemo(() => {
    const map = new Map<Sport, Match[]>();
    for (const m of filtered) map.set(m.sport, [...(map.get(m.sport) ?? []), m]);
    return SPORTS.filter((s) => map.has(s.id)).map((s) => ({ sport: s.id, list: map.get(s.id)! }));
  }, [filtered]);

  const copyJson = async () => {
    if (!matches) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify({ matches }, null, 2));
      toast.success("JSON copiado para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar o JSON");
    }
  };

  const runEnhance = async () => {
    if (!matches) return;
    setEnhancing(true);
    try {
      const res = await enhance({ data: { matches } });
      if (res.ok) {
        setMatches(res.matches as Match[]);
        toast.success("Dados normalizados pela IA");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Falha ao aprimorar com IA");
    } finally {
      setEnhancing(false);
    }
  };

  const clearAll = () => {
    setMatches(null);
    setInput("");
    setQuery("");
    setSport("all");
    setStatus("all");
    setError(null);
    toast("Dados limpos");
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <Toaster />

      <header className="mb-6 md:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-glow">SportCards</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-4xl">
          Transforme dados de partidas em <span className="text-gradient">cards esportivos</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Futebol, basquete, futebol americano e baseball — colados como texto, Markdown ou JSON.
        </p>
      </header>

      <div className="space-y-6">
        <InputPanel
          value={input}
          onChange={setInput}
          onGenerate={generate}
          onLoadSample={() => {
            setInput(SAMPLE_INPUT);
            setError(null);
          }}
          loading={loading}
          error={error}
        />

        {loading && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-border/50 bg-card/50" />
            ))}
          </div>
        )}

        {!loading && !matches && (
          <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
            <p className="text-sm font-medium text-foreground">Nenhum dado carregado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cole suas partidas acima e clique em “Gerar cards” — ou carregue o exemplo.
            </p>
          </div>
        )}

        {!loading && matches && (
          <>
            <SummaryPanel matches={matches} />

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {filtered.length} {filtered.length === 1 ? "partida encontrada" : "partidas encontradas"}
              </p>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={runEnhance} disabled={enhancing} className="gap-1.5">
                  {enhancing ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="size-3.5" aria-hidden />
                  )}
                  Aprimorar com IA
                </Button>
                <Button variant="outline" size="sm" onClick={copyJson} className="gap-1.5">
                  <Copy className="size-3.5" aria-hidden /> Copiar JSON
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-muted-foreground">
                  <Trash2 className="size-3.5" aria-hidden /> Limpar
                </Button>
              </div>
            </div>

            <FiltersBar
              query={query}
              onQuery={setQuery}
              sport={sport}
              onSport={setSport}
              status={status}
              onStatus={setStatus}
              sort={sort}
              onSort={setSort}
              counts={counts}
            />

            {grouped.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
                Nenhuma partida corresponde aos filtros atuais.
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map((g) => (
                  <SportSection key={g.sport} sport={g.sport} matches={g.list} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
