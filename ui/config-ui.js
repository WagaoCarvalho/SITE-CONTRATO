/* =========================================================================
   UI: TELA DE CONFIGURAÇÕES — identidade, cores, fonte do PDF, APIs e
   status de persistência no servidor. Sem export/import de arquivo: tudo
   é salvo automaticamente (localStorage + servidor, ver infra/configuracao.js).
   ========================================================================= */
function renderApiList(categoria) {
  const cont = document.getElementById('api-list-' + categoria);
  cont.innerHTML = CONFIG.apis[categoria].map((p, i) => `
    <div class="api-row">
      <input type="text" value="${p.nome}" data-api-field="nome" data-cat="${categoria}" data-idx="${i}" placeholder="Nome">
      <input type="text" value="${p.url}" data-api-field="url" data-cat="${categoria}" data-idx="${i}" placeholder="URL com {${categoria}}">
      <input type="text" value="${p.chave || ''}" data-api-field="chave" data-cat="${categoria}" data-idx="${i}" placeholder="Chave (opcional)">
      <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" ${p.ativo !== false ? 'checked' : ''} data-api-field="ativo" data-cat="${categoria}" data-idx="${i}"> ativo</label>
      <button class="btn secondary small" data-api-move="up" data-cat="${categoria}" data-idx="${i}">↑</button>
      <button class="btn danger small" data-api-remove="1" data-cat="${categoria}" data-idx="${i}">Remover</button>
    </div>`).join('');
}
document.querySelectorAll('#view-config').forEach(v => {
  v.addEventListener('input', e => {
    const campo = e.target.getAttribute('data-api-field');
    if (!campo) return;
    const cat = e.target.getAttribute('data-cat'), idx = Number(e.target.getAttribute('data-idx'));
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    CONFIG.apis[cat][idx][campo] = val;
    saveConfigLocal();
  });
  v.addEventListener('click', e => {
    const add = e.target.getAttribute('data-action');
    const cat = e.target.getAttribute('data-cat');
    if (add === 'add-api') {
      CONFIG.apis[cat].push({ nome: 'Nova API', url: `https://exemplo.com/{${cat}}`, chave: '', ativo: true });
      saveConfigLocal(); renderApiList(cat);
    }
    if (e.target.getAttribute('data-api-move') === 'up') {
      const idx = Number(e.target.getAttribute('data-idx'));
      if (idx > 0) { const arr = CONFIG.apis[cat]; [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; saveConfigLocal(); renderApiList(cat); }
    }
    if (e.target.getAttribute('data-api-remove')) {
      const idx = Number(e.target.getAttribute('data-idx'));
      CONFIG.apis[cat].splice(idx, 1); saveConfigLocal(); renderApiList(cat);
    }
  });
});

function aplicarFavicon(valor) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  if (!valor) return;
  // URL completa, data URI, ou caminho de arquivo (absoluto "/img.png" ou
  // relativo "images/img.png") → trata como imagem. Só vira "texto/emoji"
  // desenhado no ícone quando não parece um caminho (não tem "/" nem ".").
  const pareceArquivo = /^(https?:\/\/|data:|\.?\.?\/)/.test(valor) || /\.[a-z0-9]{2,4}$/i.test(valor);
  if (pareceArquivo) { link.href = valor; }
  else {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${valor}</text></svg>`;
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
}
function aplicarCores() {
  document.documentElement.style.setProperty('--accent', CONFIG.cores.destaque);
  document.documentElement.style.setProperty('--bg', CONFIG.cores.fundo);
  document.documentElement.style.setProperty('--ink', CONFIG.cores.texto);
}

async function atualizarStatusServidor() {
  const el = document.getElementById('status-servidor');
  if (!el) return;
  const ok = await servidorDisponivel();
  configServidorDisponivel = ok;
  el.textContent = ok ? '● Servidor conectado — configurações sincronizadas automaticamente.' : '○ Servidor não encontrado — usando apenas este navegador.';
  el.className = 'msg ' + (ok ? 'info' : 'err');
}

function renderConfig() {
  document.getElementById('cfg-nome-sistema').value = CONFIG.branding.nomeSistema;
  document.getElementById('cfg-favicon').value = CONFIG.branding.favicon || '';
  document.getElementById('cfg-fonte-familia').value = CONFIG.fonte.familia;
  document.getElementById('cfg-fonte-tamanho').value = CONFIG.fonte.tamanho;
  document.getElementById('cfg-cor-destaque').value = CONFIG.cores.destaque;
  document.getElementById('cfg-cor-fundo').value = CONFIG.cores.fundo;
  document.getElementById('cfg-cor-texto').value = CONFIG.cores.texto;
  document.getElementById('app-name').textContent = CONFIG.branding.nomeSistema;
  if (CONFIG.branding.logoDataUrl) document.getElementById('app-logo').src = CONFIG.branding.logoDataUrl;
  aplicarFavicon(CONFIG.branding.favicon);
  aplicarCores();
  ['cep', 'cnpj', 'cpf'].forEach(renderApiList);
  renderTiposContrato();
  atualizarStatusServidor();
}
document.getElementById('cfg-nome-sistema').addEventListener('input', e => {
  CONFIG.branding.nomeSistema = e.target.value;
  document.getElementById('app-name').textContent = e.target.value;
  saveConfigLocal();
});
document.getElementById('cfg-logo-input').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { CONFIG.branding.logoDataUrl = reader.result; document.getElementById('app-logo').src = reader.result; saveConfigLocal(); };
  reader.readAsDataURL(file);
});
document.getElementById('cfg-favicon').addEventListener('input', e => {
  CONFIG.branding.favicon = e.target.value; aplicarFavicon(e.target.value); saveConfigLocal();
});
document.getElementById('cfg-cor-destaque').addEventListener('input', e => { CONFIG.cores.destaque = e.target.value; aplicarCores(); saveConfigLocal(); });
document.getElementById('cfg-cor-fundo').addEventListener('input', e => { CONFIG.cores.fundo = e.target.value; aplicarCores(); saveConfigLocal(); });
document.getElementById('cfg-cor-texto').addEventListener('input', e => { CONFIG.cores.texto = e.target.value; aplicarCores(); saveConfigLocal(); });
document.getElementById('cfg-fonte-familia').addEventListener('change', e => { CONFIG.fonte.familia = e.target.value; saveConfigLocal(); });
document.getElementById('cfg-fonte-tamanho').addEventListener('input', e => { CONFIG.fonte.tamanho = Number(e.target.value); saveConfigLocal(); });

document.getElementById('btn-reset-config').addEventListener('click', () => {
  if (!confirm('Restaurar todas as configurações (APIs, cores, fonte, tipos de contrato) para o padrão de fábrica?')) return;
  CONFIG = ConfigDefaults();
  saveConfigLocal(); renderConfig(); renderSeletorTipoContrato();
});
document.getElementById('btn-salvar-servidor').addEventListener('click', async () => {
  const el = document.getElementById('status-servidor');
  el.textContent = 'Salvando no servidor...';
  const ok = await salvarConfigServidor(CONFIG);
  configServidorDisponivel = ok;
  el.textContent = ok ? '● Salvo no servidor com sucesso.' : '○ Não foi possível salvar no servidor agora.';
  el.className = 'msg ' + (ok ? 'info' : 'err');
});
