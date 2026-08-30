import { FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  onLoadSample: () => void;
  loading: boolean;
  error?: string | null;
}

export function InputPanel({ value, onChange, onGenerate, onLoadSample, loading, error }: Props) {
  return (
    <div className="surface-card rounded-2xl border border-border/60 p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Dados das partidas</h2>
          <p className="text-xs text-muted-foreground">
            Cole texto RAW, Markdown ou JSON — o parser identifica o esporte pelos cabeçalhos ⚽ 🏀 🏈 ⚾.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onLoadSample} className="gap-1.5 text-xs">
          <FileText className="size-3.5" aria-hidden /> Carregar exemplo
        </Button>
      </div>

      <label className="sr-only" htmlFor="raw-input">
        Dados das partidas
      </label>
      <textarea
        id="raw-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={"## ⚽ Futebol — Brasileirão\n[Time A x Time B - 12/09/2026 - 16:00]\n- Gols: 2 x 1\n- Escanteios: 7 x 4"}
        aria-invalid={!!error}
        className="w-full resize-y rounded-xl border border-border bg-background/60 p-3 font-mono text-xs leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
      />

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={onGenerate} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Wand2 className="size-4" aria-hidden />
          )}
          Gerar cards
        </Button>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden /> Aceita também JSON estruturado
        </span>
      </div>
    </div>
  );
}
