/* =========================================================================
   INICIALIZAÇÃO
   ========================================================================= */
function renderTudo(){
  renderParte('arrendante');
  renderParte('arrendatario');
  renderVeiculos();
  bindCamposSimples();
  atualizarValidacao();
  renderConfig();
}
renderTudo();
