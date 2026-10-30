# Victor Gomes — Link na bio

Site estático (HTML + CSS + JS puro, sem frameworks e sem build). Leve, mobile-first e pronto para hospedar em qualquer lugar.

```
index.html              página principal
privacidade.html        Política de Privacidade (modelo — complete os [campos])
termos.html             Termos de Uso (modelo — complete os [campos])
assets/css/style.css    todo o visual (cores em :root no topo)
assets/js/config.js     ⚙️ links, formulário e rastreamento — edite aqui
assets/js/main.js       comportamento (não precisa mexer)
assets/img/             favicon, imagem de compartilhamento e suas fotos
integracoes/google-apps-script.gs   receptor do formulário → Google Planilhas
```

## 1. Links dos botões

Em `assets/js/config.js`:

```js
links: { metodoPrimeiraRenda: "https://seu-funil.com/..." }
```

As UTMs do visitante são repassadas automaticamente ao link do funil. Quem chega sem UTM recebe `utm_source=instagram&utm_medium=bio` (editável em `utmPadrao`). Dica: na bio do Instagram, use o domínio puro; em stories/anúncios, adicione UTMs (ex.: `?utm_source=instagram&utm_medium=stories&utm_campaign=lancamento`).

## Quiz do Método Primeira Renda (`/quiz`)

O botão "QUERO COMEÇAR AGORA" leva ao quiz: capa → 9 perguntas (com tela de "virada" após a pergunta de crença) → apresentação → análise → prova social (caso da Poliana) logo após a pergunta de objeção → resultado personalizado pela objeção e idade → presente → bônus → oferta → checkout NeonPay.

- **Textos, perguntas e imagens:** `assets/js/quiz-data.js`
- **Link do checkout e preço exibido:** `assets/js/config.js` → `links.checkoutMPR` e `oferta`
- **Imagens e áudio:** `assets/img/quiz/`
- **Eventos:** `quiz_start`, `quiz_complete` (Meta `ViewContent`) e `begin_checkout` (Meta `InitiateCheckout`). As UTMs seguem até o checkout.
- **UTMs no checkout:** as do visitante vão primeiro; se faltarem, entram `utm_campaign=mpr` e `utm_content=funil_quiz` (`links.checkoutUtms`). `utm_term` mostra o botão clicado: `oferta` ou `garantia`.
- Para pular o quiz e mandar direto ao checkout, troque `links.metodoPrimeiraRenda` pelo link do checkout.

## Painel do funil (`/painel`)

Métricas do quiz em `https://www.ovictorgomes.com.br/painel`, com duas abas:

- **Performance:** visitas, início do quiz, média de etapas, tempo médio, cliques no checkout (com comparação ao período anterior), funil, tráfego por hora/dia, campanhas (UTMs) e dispositivos.
- **Respostas:** uma linha por visitante com a resposta de cada etapa, a % de pessoas que chegou em cada etapa e onde cada um saiu; resumo das respostas por pergunta; exportação em CSV.

Como funciona: o quiz envia a jornada anônima de cada visitante para a aba **Quiz** da planilha (via Apps Script). O painel lê essa aba usando a senha.

- **Senha:** no Apps Script → Configurações do projeto (engrenagem) → Propriedades do script → `PAINEL_SENHA`.
- **Visual sem dados reais:** `/painel?demo=1` mostra dados fictícios (só para conferir o layout).
- O painel mede até o **clique no checkout**; as vendas aprovadas ficam no painel da NeonPay (cruze pelas UTMs).

### Painel de aplicações (`/aplicacoes`)

Lista as aplicações da mentoria (aba **Aplicações**) com a mesma senha do painel: botão do WhatsApp com mensagem pronta (editável em "Mensagem pronta", usa `{nome}`), botão do Instagram e status de contato (Novo, Chamei, Respondeu, Fechou, Descartado), gravado numa coluna **Status** da planilha. Abrir o WhatsApp de alguém "Novo" já marca como "Chamei". A lista se atualiza sozinha a cada 2 minutos.

- Precisa da versão do `integracoes/google-apps-script.gs` com as ações `aplicacoes` e `status` (Implantar → Gerenciar implantações → editar → Nova versão).
- **Visual sem dados reais:** `/aplicacoes?demo=1`.

## 2. Imagens

Use **WebP ou AVIF** (converta grátis em squoosh.app). Salve em `assets/img/` e substitua os placeholders — o código pronto está em comentários no `index.html`:

| Imagem | Arquivo sugerido | Tamanho |
|---|---|---|
| Foto de perfil (já aplicada) | `victor.webp` + `victor.jpg` (fallback) | 400×400 (quadrada) |
| Card Método Primeira Renda (já aplicado) | `mpr-800.webp` + `mpr-1200.webp` | 1200×504 |
| Card Mentoria | `mentoria.avif` / `mentoria.webp` | 1200×525 (16:7) |
| Compartilhamento (WhatsApp) | `og-image.jpg` (já incluída, pode trocar) | 1200×630 |

Mantenha os atributos `width`/`height` para não haver deslocamento de layout.

## 3. Formulário (aplicações da mentoria)

O formulário **só mostra "Aplicação recebida" quando o servidor confirma** (`{ "ok": true }`). Sem `form.endpoint` configurado, ele mostra erro.

### Opção A — Google Planilhas (grátis, recomendado)

1. Crie uma planilha em sheets.google.com.
2. Menu **Extensões → Apps Script**. Apague o conteúdo e cole `integracoes/google-apps-script.gs`.
3. (Opcional) preencha `NOTIFY_EMAIL` para receber um e-mail a cada aplicação.
4. **Implantar → Nova implantação → tipo "App da Web"**. *Executar como:* Eu. *Quem pode acessar:* Qualquer pessoa. Autorize.
5. Copie a URL `https://script.google.com/macros/s/.../exec` e cole em `config.js → form.endpoint`.
6. Teste: envie uma aplicação e confira a aba **Aplicações** na planilha.

> Ao alterar o script, use **Implantar → Gerenciar implantações → editar → Nova versão** para manter a mesma URL.

### Opção B — Formspree

Crie um formulário em formspree.io e cole a URL `https://formspree.io/f/XXXX` em `form.endpoint`. Nada mais é necessário.

Os dados enviados incluem as respostas, o consentimento, as UTMs, o site de origem e a página de entrada.

## Respostas automáticas no Instagram (comentários)

`integracoes/instagram-comentarios.gs` responde publicamente comentários com "quero", "passo a passo", "link"… apontando para o link da bio (sem DM). Roda no mesmo Apps Script da planilha, a cada 5 minutos, pela API oficial do Instagram — grátis.

1. **Token (o que funcionou):** app **VicChat** na Meta → **Graph API Explorer** com as permissões `pages_show_list`, `pages_read_engagement`, `business_management`, `instagram_basic` e `instagram_manage_comments` → *Generate Access Token* (marcar a Página Victor Orsolin e o @somais1victor) → ⓘ → *Abrir na ferramenta de token de acesso* → **Estender token**. O script troca esse token pelo token da Página ligada ao Instagram, que não expira. (Token de usuário do sistema não serve: a Página não pertence ao portfólio.)
2. **Apps Script:** Arquivo **+ → Script** com o nome `instagram-comentarios`, cole o arquivo. Propriedades do script → `IG_TOKEN` = token.
3. Rode **`testarInstagram`** (só mostra a conta e os posts no registro) e depois **`ligarComentarios`** (autorize). Para parar: **`desligarComentarios`**.

- Responde só comentários feitos **depois de ligar** (nunca a fila antiga), nunca a mesma pessoa duas vezes no mesmo post, até 6 por rodada e 150 por dia, alternando 5 textos.
- Olha os 12 posts mais recentes + os de `postsFixos` (código do link do post). Palavras e textos ficam no topo do arquivo.
- Tudo fica registrado na aba **Respostas IG**. O token é renovado sozinho a cada 7 dias.

## 4. Rastreamento (Meta Pixel e Google Analytics 4)

Em `config.js → tracking`, preencha `gaId` e/ou `metaPixelId`. Enquanto estiverem vazios, nada é carregado.

Com `requireConsent: true` (padrão), aparece um aviso de cookies e os rastreadores só carregam após o visitante clicar em **Aceitar**. O link "Cookies" no rodapé permite mudar a escolha.

| Ação | GA4 | Meta |
|---|---|---|
| Clique no Método Primeira Renda | `click_metodo_primeira_renda` | `ClickMetodoPrimeiraRenda` (custom) |
| Clique na Mentoria | `click_mentoria` | `ClickMentoria` (custom) |
| Aplicação enviada com sucesso | `generate_lead` | `Lead` (padrão) |

Todos os eventos levam as UTMs como parâmetros. Para testar, use `debug: true` e abra o console do navegador.

## 5. SEO e compartilhamento

O site usa o domínio `https://www.ovictorgomes.com.br/` (Vercel, publicado a partir deste repositório) no canonical, `og:url`, `og:image` e JSON-LD do `index.html` e do `quiz.html`. Se trocar de domínio, troque **todas** essas ocorrências. O WhatsApp exige URL absoluta na imagem.

## 6. Publicar

Qualquer hospedagem estática serve. As mais simples:

- **Netlify**: app.netlify.com/drop → arraste a pasta do projeto.
- **Vercel** ou **Cloudflare Pages**: importe a pasta/repositório, sem comando de build.

Depois aponte seu domínio e coloque o link na bio.

## 7. Testar localmente

Abra `index.html` no navegador, ou rode um servidor simples na pasta:

```bash
npx serve .
```

## Checklist antes de publicar

- [ ] Link do funil em `config.js`
- [ ] `form.endpoint` configurado e testado (aplicação aparece na planilha)
- [ ] Imagens dos cards em WebP/AVIF
- [ ] Campos `[...]` preenchidos em `privacidade.html` e `termos.html`
- [ ] IDs do Pixel/GA (se for usar)
- [ ] Faixas de investimento do formulário revisadas (`index.html`)
