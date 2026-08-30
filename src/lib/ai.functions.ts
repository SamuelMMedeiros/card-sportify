import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side Gemini integration.
 *
 * The API key is NEVER exposed to the browser. It is read from the server
 * environment inside the handler:
 *   - LOVABLE_API_KEY  -> Lovable AI Gateway (default, already configured)
 *   - GEMINI_API_KEY   -> optional direct Google Gemini key
 *
 * The model may only normalize/structure existing data. It must never invent
 * statistics; inferred fields are flagged with `inferred: true`.
 */

const metricSchema = z.object({
  label: z.string(),
  value: z.string().default(""),
  inferred: z.boolean().optional(),
});

const playerSchema = z.object({
  name: z.string(),
  team: z.string().optional(),
  stats: z.string().optional(),
});

const matchSchema = z.object({
  id: z.string(),
  sport: z.enum(["futebol", "basquete", "futebol-americano", "baseball"]),
  home: z.string(),
  away: z.string(),
  competition: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  isoDate: z.string().optional(),
  status: z.enum(["scheduled", "live", "finished"]),
  metrics: z.array(metricSchema),
  players: z.array(playerSchema),
});

const inputSchema = z.object({ matches: z.array(matchSchema).min(1).max(60) });

const SYSTEM_PROMPT = `Você normaliza dados de partidas esportivas.
Regras obrigatórias:
- NUNCA invente estatísticas, jogadores, placares ou datas que não estejam nos dados.
- Preserve os valores originais; apenas padronize rótulos (ex.: "gols", "Escanteios" -> "Escanteios") e capitalização.
- Se você deduzir um campo a partir de outro campo existente, marque a métrica com "inferred": true.
- Esportes permitidos: futebol, basquete, futebol-americano, baseball.
- Responda somente com JSON no formato {"matches":[...]} mantendo os mesmos ids.`;

export const enhanceMatches = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const geminiKey = process.env["GEMINI_API_KEY"];

    if (!lovableKey && !geminiKey) {
      return {
        ok: false as const,
        error:
          "Nenhuma chave de IA configurada no servidor. Defina LOVABLE_API_KEY (AI Gateway) ou GEMINI_API_KEY nos segredos do projeto.",
      };
    }

    const endpoint = lovableKey
      ? "https://ai.gateway.lovable.dev/v1/chat/completions"
      : "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey ?? geminiKey}`,
        },
        body: JSON.stringify({
          model: lovableKey ? "google/gemini-2.5-flash" : "gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify({ matches: data.matches }) },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (res.status === 429) {
        return { ok: false as const, error: "Limite de requisições atingido. Tente novamente em instantes." };
      }
      if (res.status === 402) {
        return { ok: false as const, error: "Créditos de IA insuficientes no workspace." };
      }
      if (!res.ok) {
        console.error("AI enhance failed", res.status, await res.text());
        return { ok: false as const, error: "Não foi possível aprimorar os dados agora." };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) return { ok: false as const, error: "Resposta vazia da IA." };

      const parsed = inputSchema.safeParse(JSON.parse(content));
      if (!parsed.success) {
        return { ok: false as const, error: "A IA retornou um formato inesperado; dados originais mantidos." };
      }
      return { ok: true as const, matches: parsed.data.matches };
    } catch (e) {
      console.error("AI enhance error", e);
      return { ok: false as const, error: "Falha ao contatar o serviço de IA." };
    }
  });
