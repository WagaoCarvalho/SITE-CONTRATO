/* =========================================================================
   UI: TELA DE CLÁUSULAS — mostra as cláusulas do tipo de contrato
   selecionado no formulário (Arrendamento, Comodato, ou outro cadastrado).
   A lógica de conteúdo vive em core/contrato.js; aqui só DOM e eventos.
   ========================================================================= */
function renderClausulas() {
  sincronizarClausulasNaoEditadas(STATE, CONFIG);
  const cont = document.getElementById('clausulas-container');
  cont.innerHTML = idsClausulas(CONFIG, STATE).map((id, i) => {
    const opcoes = opcoesClausula(CONFIG, STATE, id).map(o =>
      `<option value="${o.chave}" ${o.chave === STATE.clausulasSelecionadas[id] ? 'selected' : ''}>${o.nome}</option>`
    ).join('');
    return `
      <div class="clause-block">
        <div class="clause-head">
          <b>${rotuloClausula(i)}</b>
          <div class="clause-actions">
            <select data-clause-select="${id}">${opcoes}</select>
            <button class="btn ghost small" data-clause-save="${id}">Salvar como personalizada...</button>
            <button class="btn secondary small" data-clause-reset="${id}">Restaurar padrão</button>
          </div>
        </div>
        <textarea rows="4" data-clause-text="${id}">${STATE.clausulasTextoAtual[id]}</textarea>
      </div>`;
  }).join('');
}

document.getElementById('clausulas-container').addEventListener('input', e => {
  const id = e.target.getAttribute('data-clause-text');
  if (id) {
    STATE.clausulasTextoAtual[id] = e.target.value;
    STATE.clausulasEditadoManualmente[id] = true;
    saveDraftLocal();
  }
});

document.getElementById('clausulas-container').addEventListener('change', e => {
  const id = e.target.getAttribute('data-clause-select');
  if (id) {
    STATE.clausulasSelecionadas[id] = e.target.value;
    STATE.clausulasEditadoManualmente[id] = false;
    STATE.clausulasTextoAtual[id] = substituir(textoClausulaSelecionada(STATE, CONFIG, id), montarContexto(STATE, CONFIG));
    renderClausulas(); saveDraftLocal();
  }
});

document.getElementById('clausulas-container').addEventListener('click', e => {
  const idSave = e.target.getAttribute('data-clause-save');
  const idReset = e.target.getAttribute('data-clause-reset');
  if (idSave) {
    const nome = prompt('Nome para esta cláusula personalizada:', 'Personalizada');
    if (!nome) return;
    const tipo = tipoContratoAtual(STATE, CONFIG);
    tipo.clausulasPersonalizadas[idSave] = tipo.clausulasPersonalizadas[idSave] || [];
    tipo.clausulasPersonalizadas[idSave].push({ nome, texto: STATE.clausulasTextoAtual[idSave] });
    STATE.clausulasSelecionadas[idSave] = 'custom-' + (tipo.clausulasPersonalizadas[idSave].length - 1);
    STATE.clausulasEditadoManualmente[idSave] = false;
    saveConfigLocal(); renderClausulas(); saveDraftLocal();
  }
  if (idReset) {
    STATE.clausulasSelecionadas[idReset] = 'padrao';
    STATE.clausulasEditadoManualmente[idReset] = false;
    STATE.clausulasTextoAtual[idReset] = substituir(textoClausulaPadrao(CONFIG, STATE, idReset), montarContexto(STATE, CONFIG));
    renderClausulas(); saveDraftLocal();
  }
});
