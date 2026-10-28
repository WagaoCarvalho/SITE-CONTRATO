/* =========================================================================
   VALIDAÇÃO — função pura, dirigida pelos campos obrigatórios declarados
   em TIPOS_PARTE (core/tipos-parte.js). Nenhuma ramificação PF/PJ aqui.
   ========================================================================= */
function validarParte(dados, tipo) {
  const erros = [];
  const def = TIPOS_PARTE[tipo];
  def.obrigatorios.forEach(campo => {
    if (!String(dados[campo] || '').trim()) {
      const campoDef = def.campos.find(c => c.campo === campo);
      erros.push(campoDef ? campoDef.label : campo);
    }
  });
  if (def.temSocio && !dados.socioSelecionado) erros.push('Sócio responsável');
  return erros;
}

function validarFormulario(STATE) {
  const erros = [];
  const errosArrendante = validarParte(STATE.arrendante, STATE.tipoArrendante);
  const errosArrendatario = validarParte(STATE.arrendatario, STATE.tipoArrendatario);
  if (errosArrendante.length) erros.push('Arrendante: ' + errosArrendante.join(', '));
  if (errosArrendatario.length) erros.push('Arrendatário: ' + errosArrendatario.join(', '));
  if (!STATE.veiculos.length) erros.push('Adicione ao menos um veículo.');
  if (!STATE.prazoInicio || !STATE.prazoFim) erros.push('Informe o prazo do contrato.');
  if (!STATE.comarca.trim()) erros.push('Informe a comarca.');
  return erros;
}
