/* Editor Viral Dark: aplica o mesmo cartão (template) em vários vídeos e gera MP4 1080×1920 com o áudio original.
 * Tudo roda no navegador: o vídeo toca escondido, cada quadro é desenhado num canvas com o cartão por cima e
 * codificado em H.264 (WebCodecs); o áudio é decodificado inteiro e codificado em AAC; o mp4-muxer junta os dois. */
(function () {
  'use strict';

  const W = 1080, H = 1920;
  const $ = function (id) { return document.getElementById(id); };
  const CHAVE = 'vg_editor_viral';

  const estado = {
    modo: 'montar',
    avatar: null,   // HTMLImageElement
    png: null,      // HTMLImageElement
    itens: [],      // { id, arquivo, url, el, status, blob, nome }
    gerando: false
  };

  /* ───────────── Suporte ───────────── */

  const suporta = 'VideoEncoder' in window && 'AudioEncoder' in window && 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  if (!suporta) $('sem-suporte').hidden = false;

  /* ───────────── Preferências salvas ───────────── */

  const campos = ['frase', 'selo', 'cor', 'letra', 'largura', 'posicao', 'encaixe', 'velocidade'];
  function salvar() {
    const o = {};
    campos.forEach(function (k) { const el = $(k); o[k] = el.type === 'checkbox' ? el.checked : el.value; });
    o.modo = estado.modo;
    if (estado.avatar && estado.avatar.dataset.salvo) o.avatar = estado.avatar.dataset.salvo;
    try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) { /* sem espaço ou bloqueado */ }
  }
  function carregar() {
    let o = null;
    try { o = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { /* ignora */ }
    if (!o) return Promise.resolve();
    campos.forEach(function (k) {
      if (o[k] == null) return;
      const el = $(k);
      if (el.type === 'checkbox') el.checked = !!o[k]; else el.value = o[k];
    });
    if (o.modo) trocarModo(o.modo);
    if (!o.avatar) return Promise.resolve();
    return imagem(o.avatar).then(function (img) {
      img.dataset.salvo = o.avatar;
      estado.avatar = img;
      $('avatar-nome').textContent = 'Foto do perfil ✓';
    }).catch(function () {});
  }

  /* ───────────── Cartão ───────────── */

  function imagem(src) {
    return new Promise(function (ok, falha) {
      const img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = falha;
      img.src = src;
    });
  }

  // Quebra a frase em linhas que cabem na largura
  function linhas(ctx, texto, max) {
    const out = [];
    String(texto).split(/\n/).forEach(function (par) {
      let atual = '';
      par.split(/\s+/).filter(Boolean).forEach(function (p) {
        const teste = atual ? atual + ' ' + p : p;
        if (ctx.measureText(teste).width > max && atual) { out.push(atual); atual = p; } else atual = teste;
      });
      if (atual) out.push(atual);
    });
    return out;
  }

  function cantos(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function selo(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = '#1d9bf0';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, cy + r * 0.02);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.36);
    ctx.lineTo(cx + r * 0.48, cy - r * 0.3);
    ctx.stroke();
    ctx.restore();
  }

  // Desenha o cartão num canvas próprio (ou devolve o PNG escolhido) para colar em cada quadro
  function montarCartao() {
    const largura = Math.round(W * Number($('largura').value) / 100);
    if (estado.modo === 'png') {
      if (!estado.png) return null;
      const img = estado.png;
      const cheio = Math.abs(img.width / img.height - W / H) < 0.02; // moldura 9:16 inteira
      return { img: img, cheio: cheio, w: largura, h: Math.round(largura * img.height / img.width) };
    }

    const escuro = $('cor').value === 'preto';
    const tam = Number($('letra').value) * (largura / (W * 0.82));
    const pad = Math.round(largura * 0.07);
    const avatar = estado.avatar ? Math.round(largura * 0.2) : 0;

    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = '800 ' + tam + 'px Manrope, "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    const ls = linhas(ctx, $('frase').value.trim() || ' ', largura - pad * 2);
    const alt = Math.round(pad + (avatar ? avatar + pad * 0.6 : 0) + ls.length * tam * 1.22 + pad * 0.8);

    c.width = largura; c.height = alt;
    ctx.font = '800 ' + tam + 'px Manrope, "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 0;
    ctx.fillStyle = escuro ? '#0b0b0b' : '#ffffff';
    cantos(ctx, 0, 0, largura, alt, Math.round(largura * 0.06));
    ctx.fill();

    let y = pad;
    if (avatar) {
      const cx = largura / 2, cy = y + avatar / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, avatar / 2, 0, Math.PI * 2); ctx.clip();
      const a = estado.avatar, lado = Math.min(a.width, a.height);
      ctx.drawImage(a, (a.width - lado) / 2, (a.height - lado) / 2, lado, lado, cx - avatar / 2, cy - avatar / 2, avatar, avatar);
      ctx.restore();
      if ($('selo').checked) selo(ctx, cx + avatar * 0.36, cy + avatar * 0.36, avatar * 0.15);
      y += avatar + pad * 0.6;
    }

    ctx.fillStyle = escuro ? '#ffffff' : '#111111';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ls.forEach(function (l, i) { ctx.fillText(l, largura / 2, y + i * tam * 1.22); });
    return { img: c, cheio: false, w: largura, h: alt };
  }

  /* ───────────── Composição do quadro ───────────── */

  function desenharQuadro(ctx, video, cartao) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (video && video.videoWidth) {
      const vw = video.videoWidth, vh = video.videoHeight;
      if ($('encaixe').value === 'desfoque') {
        const sc = Math.max(W / vw, H / vh);
        ctx.save();
        ctx.filter = 'blur(40px) brightness(.6)';
        ctx.drawImage(video, (W - vw * sc) / 2, (H - vh * sc) / 2, vw * sc, vh * sc);
        ctx.restore();
        const s2 = Math.min(W / vw, H / vh);
        ctx.drawImage(video, (W - vw * s2) / 2, (H - vh * s2) / 2, vw * s2, vh * s2);
      } else {
        const sc = Math.max(W / vw, H / vh);
        ctx.drawImage(video, (W - vw * sc) / 2, (H - vh * sc) / 2, vw * sc, vh * sc);
      }
    }
    if (!cartao) return;
    if (cartao.cheio) { ctx.drawImage(cartao.img, 0, 0, W, H); return; }
    const y = Math.round(H * Number($('posicao').value) / 100);
    ctx.drawImage(cartao.img, Math.round((W - cartao.w) / 2), y, cartao.w, cartao.h);
  }

  /* ───────────── Prévia ───────────── */

  const pctx = $('preview').getContext('2d');
  let cartaoAtual = null;

  function atualizarPrevia() {
    $('o-letra').textContent = $('letra').value;
    $('o-largura').textContent = $('largura').value + '%';
    $('o-posicao').textContent = $('posicao').value + '%';
    cartaoAtual = montarCartao();
    const primeiro = estado.itens[0];
    desenharQuadro(pctx, primeiro && primeiro.el, cartaoAtual);
    if (!primeiro) {
      pctx.fillStyle = '#39ff7a';
      pctx.font = '700 40px "JetBrains Mono", monospace';
      pctx.textAlign = 'center';
      pctx.fillText('[ adicione vídeos ]', W / 2, H * 0.62);
    }
    salvar();
  }

  /* ───────────── Interface ───────────── */

  function trocarModo(modo) {
    estado.modo = modo;
    document.querySelectorAll('.ed-seg button').forEach(function (b) { b.classList.toggle('is-on', b.dataset.modo === modo); });
    document.querySelectorAll('[data-so]').forEach(function (el) { el.hidden = el.dataset.so !== modo; });
  }

  document.querySelectorAll('.ed-seg button').forEach(function (b) {
    b.addEventListener('click', function () { trocarModo(b.dataset.modo); atualizarPrevia(); });
  });
  campos.forEach(function (k) { $(k).addEventListener('input', atualizarPrevia); });

  $('avatar').addEventListener('change', function () {
    const f = this.files[0];
    if (!f) return;
    imagem(URL.createObjectURL(f)).then(function (img) {
      // guarda uma versão pequena para lembrar da foto na próxima visita
      const c = document.createElement('canvas'), lado = Math.min(img.width, img.height), t = Math.min(320, lado);
      c.width = c.height = t;
      c.getContext('2d').drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, t, t);
      return imagem(c.toDataURL('image/jpeg', 0.9));
    }).then(function (img) {
      img.dataset.salvo = img.src;
      estado.avatar = img;
      $('avatar-nome').textContent = 'Foto do perfil ✓';
      atualizarPrevia();
    });
  });

  $('png').addEventListener('change', function () {
    const f = this.files[0];
    if (!f) return;
    imagem(URL.createObjectURL(f)).then(function (img) {
      estado.png = img;
      $('png-nome').textContent = f.name;
      atualizarPrevia();
    });
  });

  const drop = $('drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); adicionar(e.dataTransfer.files); });
  $('videos').addEventListener('change', function () { adicionar(this.files); this.value = ''; });

  let seq = 0;
  function adicionar(arquivos) {
    Array.prototype.forEach.call(arquivos, function (f) {
      if (!/^video\//.test(f.type) && !/\.(mp4|mov|webm|m4v)$/i.test(f.name)) return;
      const item = { id: ++seq, arquivo: f, url: URL.createObjectURL(f), status: 'fila', blob: null };
      item.nome = f.name.replace(/\.[^.]+$/, '') + '_viral.mp4';
      const el = document.createElement('video');
      el.src = item.url; el.muted = true; el.playsInline = true; el.preload = 'auto';
      item.el = el;
      el.addEventListener('loadeddata', function () {
        if (estado.itens[0] === item) { el.currentTime = Math.min(1, el.duration / 2 || 0); }
        info(item, duracao(el.duration));
      });
      el.addEventListener('seeked', function () { if (estado.itens[0] === item && !estado.gerando) atualizarPrevia(); });
      estado.itens.push(item);
      desenharItem(item);
    });
    atualizarBotoes();
    atualizarPrevia();
  }

  function duracao(s) {
    if (!isFinite(s)) return '';
    s = Math.round(s);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function desenharItem(item) {
    const li = document.createElement('li');
    li.innerHTML = '<div class="th"></div><div><div class="nome"></div><div class="info">na fila</div><div class="mini"><i></i></div></div><div class="acao"><button type="button">remover</button></div>';
    li.querySelector('.th').appendChild(item.el);
    li.querySelector('.nome').textContent = item.arquivo.name;
    li.querySelector('button').addEventListener('click', function () {
      if (estado.gerando) return;
      estado.itens = estado.itens.filter(function (i) { return i !== item; });
      URL.revokeObjectURL(item.url);
      li.remove();
      atualizarBotoes();
      if (estado.itens[0]) estado.itens[0].el.currentTime = Math.min(1, estado.itens[0].el.duration / 2 || 0);
      atualizarPrevia();
    });
    item.li = li;
    $('lista').appendChild(li);
  }

  function info(item, texto, classe) {
    const el = item.li && item.li.querySelector('.info');
    if (!el) return;
    el.textContent = texto;
    el.className = 'info' + (classe ? ' ' + classe : '');
  }

  function atualizarBotoes() {
    $('gerar').disabled = !suporta || estado.gerando || !estado.itens.length;
    $('zip').disabled = estado.gerando || !estado.itens.some(function (i) { return i.blob; });
  }

  function status(texto, ocupado) {
    $('status').innerHTML = '<i></i> ' + texto;
    $('status').classList.toggle('is-busy', !!ocupado);
  }

  /* ───────────── Codificação ───────────── */

  async function configVideo() {
    for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.640032']) {
      const cfg = { codec: codec, width: W, height: H, bitrate: 10000000, framerate: 30, avc: { format: 'avc' } };
      try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; } catch (e) { /* tenta o próximo */ }
    }
    throw new Error('o navegador não gera H.264');
  }

  async function lerAudio(arquivo) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
      const buf = await ac.decodeAudioData(await arquivo.arrayBuffer());
      ac.close();
      return buf;
    } catch (e) {
      return null; // vídeo sem áudio
    }
  }

  async function gerarUm(item, cfgVideo) {
    const video = item.el;
    const audio = await lerAudio(item.arquivo);
    let cfgAudio = null;
    if (audio) {
      cfgAudio = { codec: 'mp4a.40.2', sampleRate: audio.sampleRate, numberOfChannels: Math.min(2, audio.numberOfChannels), bitrate: 160000 };
      if (!(await AudioEncoder.isConfigSupported(cfgAudio)).supported) throw new Error('o navegador não gera áudio AAC');
    }

    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: { codec: 'avc', width: W, height: H },
      audio: cfgAudio ? { codec: 'aac', sampleRate: cfgAudio.sampleRate, numberOfChannels: cfgAudio.numberOfChannels } : undefined,
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset'
    });

    let erro = null;
    const venc = new VideoEncoder({ output: function (c, m) { muxer.addVideoChunk(c, m); }, error: function (e) { erro = e; } });
    venc.configure(cfgVideo);

    // Áudio: codifica tudo de uma vez a partir do arquivo decodificado
    if (cfgAudio) {
      const aenc = new AudioEncoder({ output: function (c, m) { muxer.addAudioChunk(c, m); }, error: function (e) { erro = e; } });
      aenc.configure(cfgAudio);
      const canais = cfgAudio.numberOfChannels, bloco = 4800, total = audio.length;
      const dados = []; for (let c = 0; c < canais; c++) dados.push(audio.getChannelData(c));
      for (let i = 0; i < total; i += bloco) {
        const n = Math.min(bloco, total - i), plano = new Float32Array(n * canais);
        for (let c = 0; c < canais; c++) plano.set(dados[c].subarray(i, i + n), c * n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: audio.sampleRate, numberOfFrames: n, numberOfChannels: canais, timestamp: Math.round(i / audio.sampleRate * 1e6), data: plano });
        aenc.encode(ad); ad.close();
      }
      await aenc.flush(); aenc.close();
    }

    // Vídeo: toca o arquivo e desenha cada quadro com o cartão por cima
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const dur = video.duration;
    let ultimo = -1, quadros = 0;

    // O Chrome pula quadros de vídeo fora da tela: durante a geração ele fica no monitor fixo do canto
    $('monitor').appendChild(video);
    $('monitor').hidden = false;

    video.pause();
    video.currentTime = 0;
    await new Promise(function (ok) { video.addEventListener('seeked', ok, { once: true }); });
    video.playbackRate = Number($('velocidade').value) || 1;

    await new Promise(function (ok, falha) {
      function quadro(agora, meta) {
        if (erro) { falha(erro); return; }
        const t = Math.round(meta.mediaTime * 1e6);
        if (t > ultimo) {
          ultimo = t;
          desenharQuadro(ctx, video, cartaoAtual);
          const vf = new VideoFrame(canvas, { timestamp: t });
          venc.encode(vf, { keyFrame: quadros % 60 === 0 });
          vf.close();
          quadros++;
          const p = Math.min(1, meta.mediaTime / dur);
          item.li.querySelector('.mini i').style.width = (p * 100).toFixed(1) + '%';
          item.progresso = p;
          progressoGeral();
        }
        if (!video.ended) video.requestVideoFrameCallback(quadro);
      }
      video.requestVideoFrameCallback(quadro);
      video.addEventListener('ended', function () { ok(); }, { once: true });
      video.addEventListener('error', function () { falha(new Error('não consegui ler este vídeo')); }, { once: true });
      video.play().catch(falha);
    }).finally(function () {
      item.li.querySelector('.th').appendChild(video);
      $('monitor').hidden = true;
    });

    await venc.flush(); venc.close();
    if (erro) throw erro;
    if (!quadros) throw new Error('nenhum quadro lido');
    muxer.finalize();
    video.playbackRate = 1;
    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  }

  function progressoGeral() {
    const n = estado.itens.length || 1;
    const soma = estado.itens.reduce(function (s, i) { return s + (i.blob ? 1 : (i.progresso || 0)); }, 0);
    $('barra').style.width = (soma / n * 100).toFixed(1) + '%';
  }

  $('gerar').addEventListener('click', async function () {
    if (estado.gerando) return;
    estado.gerando = true;
    atualizarBotoes();
    cartaoAtual = montarCartao();
    let cfg;
    try { cfg = await configVideo(); } catch (e) {
      $('progresso').textContent = 'Erro: ' + e.message + '. Use o Chrome ou o Edge atualizado.';
      estado.gerando = false; atualizarBotoes(); return;
    }

    const fila = estado.itens.filter(function (i) { return !i.blob; });
    let feitos = 0, falhas = 0;
    for (const item of fila) {
      status('gerando ' + (feitos + falhas + 1) + ' de ' + fila.length, true);
      $('progresso').textContent = 'Gerando ' + item.arquivo.name + '… deixe esta aba aberta e na frente.';
      info(item, 'gerando…');
      item.progresso = 0;
      try {
        item.blob = await gerarUm(item, cfg);
        feitos++;
        info(item, 'pronto · ' + (item.blob.size / 1048576).toFixed(1) + ' MB', 'ok');
        const acao = item.li.querySelector('.acao');
        acao.innerHTML = '';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(item.blob); a.download = item.nome; a.textContent = 'baixar';
        acao.appendChild(a);
      } catch (e) {
        falhas++;
        info(item, 'erro: ' + String(e.message || e).slice(0, 80), 'erro');
      }
      progressoGeral();
    }

    estado.gerando = false;
    atualizarBotoes();
    status(falhas ? feitos + ' prontos, ' + falhas + ' com erro' : 'pronto', false);
    $('progresso').textContent = feitos + ' vídeo(s) pronto(s)' + (falhas ? ', ' + falhas + ' com erro' : '') + '. Baixe um por um ou todos de uma vez no .zip.';
    atualizarPrevia();
  });

  $('zip').addEventListener('click', async function () {
    const prontos = estado.itens.filter(function (i) { return i.blob; });
    if (!prontos.length) return;
    $('zip').disabled = true;
    status('montando o zip', true);
    const zip = new JSZip();
    const usados = {};
    prontos.forEach(function (i) {
      let nome = i.nome;
      if (usados[nome]) nome = nome.replace(/\.mp4$/, '_' + i.id + '.mp4');
      usados[nome] = true;
      zip.file(nome, i.blob);
    });
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'editor-viral-dark.zip';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
    status('pronto', false);
    atualizarBotoes();
  });

  window.addEventListener('beforeunload', function (e) {
    if (estado.gerando) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ───────────── Início ───────────── */

  carregar().then(function () {
    return document.fonts ? document.fonts.load('800 46px Manrope') : null;
  }).then(atualizarPrevia, atualizarPrevia);
})();
