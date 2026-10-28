/* =========================================================================
   ESTADO DO FORMULÁRIO (rascunho do contrato em preenchimento).
   Autosave local a cada alteração — sem export/import manual: preencher e
   sair da página mantém tudo, pois o rascunho é salvo automaticamente no
   localStorage e recarregado na próxima abertura.
   ========================================================================= */
function loadDraftLocal() {
  return lerLocal(CHAVES_LOCALSTORAGE.RASCUNHO, null);
}
function saveDraftLocal() {
  salvarLocal(CHAVES_LOCALSTORAGE.RASCUNHO, STATE);
}

// Mescla com o estado inicial para não quebrar se um rascunho antigo não tiver campos novos.
let STATE = Object.assign(estadoInicial(), loadDraftLocal() || {});
if (!STATE.clausulasSelecionadas) STATE.clausulasSelecionadas = {};
if (!STATE.clausulasEditadoManualmente) STATE.clausulasEditadoManualmente = {};
if (!STATE.tipoContrato) STATE.tipoContrato = 'arrendamento';
