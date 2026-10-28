/* =========================================================================
   INICIALIZAÇÃO GERAL — renderiza tudo com a config local (instantâneo) e,
   em paralelo, busca a config do servidor para sincronizar chaves de API,
   tipos de contrato e demais ajustes salvos de outro computador/sessão.
   ========================================================================= */
function renderTudo() {
  garantirEstruturaClausulas(STATE, CONFIG);
  renderSeletorTipoContrato();
  renderParte('arrendante');
  renderParte('arrendatario');
  renderVeiculos();
  bindCamposSimples();
  atualizarValidacaoUI();
  renderConfig();
}
renderTudo();
inicializarConfiguracaoServidor(renderTudo);
