/* ==========================================================================
   Acelerador MPR — gera o texto do carrossel com a IA (Vercel Function)
   Variáveis de ambiente na Vercel:
   - ANTHROPIC_API_KEY  (obrigatória)
   - ACELERADOR_CODIGO  (opcional: se existir, a página precisa enviar esse código)
   ========================================================================== */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const OBJETIVOS = {
  seguidores: "atrair seguidores novos (conteúdo de valor, fácil de compartilhar)",
  vender: "levar para a venda de um produto digital (termina chamando para o link da bio)",
  engajamento: "gerar comentários e salvamentos (pergunta ou palavra-chave no final)"
};

const SCHEMA = {
  type: "object",
  properties: {
    slides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          texto: { type: "string" }
        },
        required: ["titulo", "texto"],
        additionalProperties: false
      }
    },
    legenda: { type: "string" }
  },
  required: ["slides", "legenda"],
  additionalProperties: false
};

const SYSTEM = `Você escreve carrosséis de Instagram em português do Brasil para perfis que vendem produtos digitais sem aparecer (sem rosto).

Regras:
- Slide 1 é a capa: "titulo" é um gancho curto e forte (até 60 caracteres) que faz a pessoa arrastar; "texto" é um subtítulo de até 90 caracteres.
- Slides do meio: um ponto por slide. "titulo" até 50 caracteres, "texto" até 200 caracteres, frases curtas e diretas, linguagem simples.
- Último slide é a chamada: "titulo" curto; "texto" pede a ação do objetivo (comentar a palavra-chave, salvar, ou ir no link da bio).
- Nada de promessa de ganho em valores ou prazos ("ganhe R$ 10 mil", "em 7 dias"). Sem emojis nos slides.
- "legenda": legenda do post com 3 a 6 linhas, a mesma chamada do último slide e 5 hashtags do nicho no final.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "metodo" });

  const codigo = process.env.ACELERADOR_CODIGO;
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (codigo && body.codigo !== codigo) return res.status(401).json({ erro: "codigo" });

  const nicho = String(body.nicho || "").trim().slice(0, 120);
  const tema = String(body.tema || "").trim().slice(0, 200);
  const objetivo = OBJETIVOS[body.objetivo] ? body.objetivo : "seguidores";
  const palavra = String(body.palavra || "").trim().slice(0, 30);
  const total = [5, 7, 9].includes(+body.slides) ? +body.slides : 7;
  if (!nicho) return res.status(400).json({ erro: "nicho" });

  const pedido = [
    `Nicho do perfil: ${nicho}`,
    tema ? `Tema do carrossel: ${tema}` : "Tema: escolha o tema com mais chance de viralizar nesse nicho.",
    `Objetivo: ${OBJETIVOS[objetivo]}`,
    palavra ? `Palavra-chave para comentar: ${palavra}` : "",
    `Quantidade de slides: exatamente ${total}.`
  ].filter(Boolean).join("\n");

  try {
    const msg = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: pedido }],
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default"
    });

    if (msg.stop_reason === "refusal") return res.status(422).json({ erro: "recusado" });
    const texto = msg.content.find((b) => b.type === "text");
    if (!texto) return res.status(502).json({ erro: "vazio" });

    const dados = JSON.parse(texto.text);
    dados.slides = dados.slides.slice(0, total);
    return res.status(200).json(dados);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ erro: "limite" });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ erro: "ia", status: e.status });
    console.error("[carrossel]", e);
    return res.status(500).json({ erro: "interno" });
  }
}
