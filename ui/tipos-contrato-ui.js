/* =========================================================================
   UI: GESTÃO DE TIPOS DE CONTRATO — em Configurações. Permite editar os
   tipos existentes (Arrendamento, Comodato) e cadastrar novos tipos, cada
   um com seu título de documento, papéis das partes (ex.: COMODANTE/
   COMODATÁRIO) e sua própria lista de cláusulas padrão.
   ========================================================================= */
function renderTiposContrato() {
  const cont = document.getElementById('tipos-contrato-lista');
  if (!cont) return;
  cont.innerHTML = Object.keys(CONFIG.tiposContrato).map(chave => {
    const t = CONFIG.tiposContrato[chave];
    const idsOrdenados = Object.keys(t.clausulasPadrao).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    const clausulas = idsOrdenados.map((id, i) => `
      <div class="row-inline" style="align-items:flex-start;margin-bottom:10px;">
        <textarea rows="3" style="flex:1;" data-tipo="${chave}" data-clausula-id="${id}">${t.clausulasPadrao[id]}</textarea>
        <button class="btn danger small" data-tipo="${chave}" data-remover-clausula="${id}">Remover</button>
      </div>`).join('');
    return `
      <div class="card" style="margin-top:12px;" data-tipo-bloco="${chave}">
        <div class="row-inline" style="justify-content:space-between;">
          <input type="text" style="font-weight:600;" data-tipo="${chave}" data-tipo-campo="nome" value="${t.nome}">
          <button class="btn danger small" data-tipo="${chave}" data-remover-tipo="1">Remover tipo</button>
        </div>
        <div class="grid" style="margin-top:8px;">
          <div class="field"><label>Título do documento</label><input type="text" data-tipo="${chave}" data-tipo-campo="titulo" value="${t.titulo}"></div>
          <div class="field"><label>Papel A (ex.: ARRENDANTE)</label><input type="text" data-tipo="${chave}" data-tipo-campo="papelA" value="${t.papelA}"></div>
          <div class="field"><label>Papel B (ex.: ARRENDATÁRIO(A))</label><input type="text" data-tipo="${chave}" data-tipo-campo="papelB" value="${t.papelB}"></div>
        </div>
        <h3>Cláusulas padrão</h3>
        ${clausulas}
        <button class="btn secondary small" data-tipo="${chave}" data-adicionar-clausula="1" style="margin-top:8px;">+ Adicionar cláusula padrão</button>
      </div>`;
  }).join('');
}

function slugify(nome) {
  return nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'tipo-' + Date.now();
}

document.getElementById('btn-add-tipo-contrato').addEventListener('click', () => {
  const nome = prompt('Nome do novo tipo de contrato (ex.: Comodato, Locação):');
  if (!nome) return;
  const papelA = prompt('Como se chama a parte "A" neste contrato? (ex.: LOCADOR)', 'PARTE A') || 'PARTE A';
  const papelB = prompt('Como se chama a parte "B" neste contrato? (ex.: LOCATÁRIO(A))', 'PARTE B') || 'PARTE B';
  let chave = slugify(nome);
  if (CONFIG.tiposContrato[chave]) chave += '-' + Date.now();
  CONFIG.tiposContrato[chave] = construirEntradaTipoContrato({
    nome, papelA, papelB,
    titulo: `CONTRATO DE ${nome.toUpperCase()}`,
    clausulasPadrao: { c1: `O(A) {{PAPEL_A}} e o(a) {{PAPEL_B}} ajustam o presente contrato de ${nome.toLowerCase()}, nos termos a seguir.` }
  });
  saveConfigLocal(); renderTiposContrato(); renderSeletorTipoContrato();
});

document.getElementById('tipos-contrato-lista').addEventListener('input', e => {
  const chave = e.target.getAttribute('data-tipo');
  if (!chave) return;
  const campo = e.target.getAttribute('data-tipo-campo');
  const clausulaId = e.target.getAttribute('data-clausula-id');
  if (campo) {
    CONFIG.tiposContrato[chave][campo] = e.target.value;
    saveConfigLocal();
    if (campo === 'nome') renderSeletorTipoContrato();
  } else if (clausulaId) {
    CONFIG.tiposContrato[chave].clausulasPadrao[clausulaId] = e.target.value;
    saveConfigLocal();
  }
});

document.getElementById('tipos-contrato-lista').addEventListener('click', e => {
  const chave = e.target.getAttribute('data-tipo');
  if (!chave) return;
  const tipo = CONFIG.tiposContrato[chave];

  if (e.target.getAttribute('data-remover-tipo')) {
    if (Object.keys(CONFIG.tiposContrato).length <= 1) { alert('Precisa existir ao menos um tipo de contrato.'); return; }
    if (!confirm(`Remover o tipo "${tipo.nome}"?`)) return;
    delete CONFIG.tiposContrato[chave];
    if (STATE.tipoContrato === chave) STATE.tipoContrato = Object.keys(CONFIG.tiposContrato)[0];
    saveConfigLocal(); saveDraftLocal(); renderTiposContrato(); renderSeletorTipoContrato();
    if (typeof renderClausulas === 'function') renderClausulas();
    return;
  }

  if (e.target.getAttribute('data-adicionar-clausula')) {
    const ids = Object.keys(tipo.clausulasPadrao);
    const proximo = 'c' + (ids.length + 1);
    tipo.clausulasPadrao[proximo] = 'Nova cláusula — edite este texto.';
    saveConfigLocal(); renderTiposContrato();
    if (STATE.tipoContrato === chave) { garantirEstruturaClausulas(STATE, CONFIG); if (typeof renderClausulas === 'function') renderClausulas(); }
    return;
  }

  const idRemover = e.target.getAttribute('data-remover-clausula');
  if (idRemover) {
    if (Object.keys(tipo.clausulasPadrao).length <= 1) { alert('O tipo precisa ter ao menos uma cláusula.'); return; }
    delete tipo.clausulasPadrao[idRemover];
    delete tipo.clausulasPersonalizadas[idRemover];
    // renumera para manter c1..cN contíguos
    const textos = Object.keys(tipo.clausulasPadrao).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))).map(id => tipo.clausulasPadrao[id]);
    tipo.clausulasPadrao = {};
    textos.forEach((texto, i) => { tipo.clausulasPadrao['c' + (i + 1)] = texto; });
    tipo.clausulasPersonalizadas = {};
    if (STATE.tipoContrato === chave) { STATE.clausulasSelecionadas = {}; STATE.clausulasEditadoManualmente = {}; garantirEstruturaClausulas(STATE, CONFIG); }
    saveConfigLocal(); saveDraftLocal(); renderTiposContrato();
    if (typeof renderClausulas === 'function') renderClausulas();
  }
});
