/* =========================================================================
   MÓDULO: TEXTO DO CONTRATO (montagem por cláusula)
   ========================================================================= */
function qualificacao(prefixo){
  const tipo = prefixo==='arrendante'?STATE.tipoArrendante:STATE.tipoArrendatario;
  const p = STATE[prefixo];
  const papel = prefixo==='arrendante' ? 'ARRENDANTE' : 'ARRENDATÁRIO(A)';
  if(tipo==='PF'){
    return `${p.nome}, nacionalidade ${p.nacionalidade||'brasileira'}, profissão ${p.profissao||'autônomo(a)'}, portador(a) do CPF nº ${formatCPF(p.cpf)}, residente e domiciliado(a) à ${p.logradouro}, nº ${p.numero||'S/N'}, Bairro ${p.bairro}, CEP ${formatCEP(p.cep)}, na cidade de ${p.cidade}/${p.uf}, doravante denominado(a) ${papel}`;
  }
  return `${p.nomeEmpresa}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${formatCNPJ(p.cnpj)}, com sede à ${p.logradouro}, nº ${p.numero||'S/N'}, Bairro ${p.bairro}, CEP ${formatCEP(p.cep)}, na cidade de ${p.cidade}/${p.uf}, neste ato representada por seu sócio ${p.socioSelecionado}, doravante denominada ${papel}`;
}
function nomeAssinante(prefixo){
  const tipo = prefixo==='arrendante'?STATE.tipoArrendante:STATE.tipoArrendatario;
  const p = STATE[prefixo];
  return tipo==='PF' ? p.nome : p.socioSelecionado;
}
function listaVeiculosTexto(){
  return STATE.veiculos.map(v=>`• Placa: ${v.placa}, Marca/Modelo: ${v.marca}, Ano: ${v.ano||'-'}, Chassis: ${v.chassis||'-'}.`).join('\n');
}
function montarContexto(){
  return {
    LISTA_VEICULOS: listaVeiculosTexto(),
    DATA_INICIO: dataBR(STATE.prazoInicio),
    DATA_FIM: dataBR(STATE.prazoFim),
    COMARCA: STATE.comarca
  };
}
function substituir(texto, ctx){
  return texto.replace(/{{(\w+)}}/g, (_,k)=> ctx[k]!==undefined ? ctx[k] : `{{${k}}}`);
}

/* ---- Versão "segmentada" (para negritar só as informações dinâmicas no PDF) ---- */
function seg(t){ return { text:t, bold:false }; }
function dyn(t){ return { text:String(t), bold:true }; }
function qualificacaoSegmentos(prefixo){
  const tipo = prefixo==='arrendante'?STATE.tipoArrendante:STATE.tipoArrendatario;
  const p = STATE[prefixo];
  const papel = prefixo==='arrendante' ? 'ARRENDANTE' : 'ARRENDATÁRIO(A)';
  if(tipo==='PF'){
    return [
      dyn(p.nome), seg(', nacionalidade '), dyn(p.nacionalidade||'brasileira'), seg(', profissão '), dyn(p.profissao||'autônomo(a)'),
      seg(', portador(a) do CPF nº '), dyn(formatCPF(p.cpf)), seg(', residente e domiciliado(a) à '), dyn(p.logradouro),
      seg(', nº '), dyn(p.numero||'S/N'), seg(', Bairro '), dyn(p.bairro), seg(', CEP '), dyn(formatCEP(p.cep)),
      seg(', na cidade de '), dyn(p.cidade+'/'+p.uf), seg(', doravante denominado(a) '+papel)
    ];
  }
  return [
    dyn(p.nomeEmpresa), seg(', pessoa jurídica de direito privado, inscrita no CNPJ sob nº '), dyn(formatCNPJ(p.cnpj)),
    seg(', com sede à '), dyn(p.logradouro), seg(', nº '), dyn(p.numero||'S/N'), seg(', Bairro '), dyn(p.bairro),
    seg(', CEP '), dyn(formatCEP(p.cep)), seg(', na cidade de '), dyn(p.cidade+'/'+p.uf),
    seg(', neste ato representada por seu sócio '), dyn(p.socioSelecionado), seg(', doravante denominada '+papel)
  ];
}
function segmentosListaVeiculos(){
  const arr = [];
  STATE.veiculos.forEach(v=>{
    arr.push(seg('• Placa: '), dyn(v.placa), seg(', Ano: '), dyn(v.ano||'-'), seg(', Marca/Modelo: '), dyn(v.marca), seg(', Chassis: '), dyn(v.chassis||'-'), seg('.\n'));
  });
  return arr;
}
function montarContextoSegmentado(){
  return {
    LISTA_VEICULOS: segmentosListaVeiculos(),
    DATA_INICIO: dyn(dataBR(STATE.prazoInicio)),
    DATA_FIM: dyn(dataBR(STATE.prazoFim)),
    COMARCA: dyn(STATE.comarca)
  };
}
function segmentarTemplate(template, ctxSeg){
  const partes = template.split(/({{\w+}})/g);
  const resultado = [];
  partes.forEach(p=>{
    const m = p.match(/^{{(\w+)}}$/);
    if(m){
      const val = ctxSeg[m[1]];
      if(Array.isArray(val)) resultado.push(...val);
      else if(val!==undefined) resultado.push(val);
      else resultado.push(seg(p));
    } else if(p) resultado.push(seg(p));
  });
  return resultado;
}

function textoClausulaPadrao(id){ return CONFIG.clausulasPadrao[id]; }
function opcoesClausula(id){
  const personalizadas = CONFIG.clausulasPersonalizadas[id] || [];
  return [{ chave:'padrao', nome:'Padrão' }, ...personalizadas.map((c,i)=>({ chave:'custom-'+i, nome:c.nome }))];
}
function textoClausulaSelecionada(id){
  const sel = STATE.clausulasSelecionadas[id];
  if(sel==='padrao') return textoClausulaPadrao(id);
  const idx = Number(sel.replace('custom-',''));
  const c = (CONFIG.clausulasPersonalizadas[id]||[])[idx];
  return c ? c.texto : textoClausulaPadrao(id);
}

/* ---- Sincronização e edição das cláusulas ---- */
function sincronizarClausulasNaoEditadas(){
  const ctx = montarContexto();
  Object.keys(CLAUSE_LABELS).forEach(id=>{
    if(!STATE.clausulasEditadoManualmente[id]){
      STATE.clausulasTextoAtual[id] = substituir(textoClausulaSelecionada(id), ctx);
    }
  });
}
function renderClausulas(){
  sincronizarClausulasNaoEditadas();
  const cont = document.getElementById('clausulas-container');
  cont.innerHTML = Object.keys(CLAUSE_LABELS).map(id=>{
    const opcoes = opcoesClausula(id).map(o=>`<option value="${o.chave}" ${o.chave===STATE.clausulasSelecionadas[id]?'selected':''}>${o.nome}</option>`).join('');
    return `
      <div class="clause-block">
        <div class="clause-head">
          <b>${CLAUSE_LABELS[id]}</b>
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
document.getElementById('clausulas-container').addEventListener('input', e=>{
  const id = e.target.getAttribute('data-clause-text');
  if(id){ STATE.clausulasTextoAtual[id] = e.target.value; STATE.clausulasEditadoManualmente[id] = true; saveDraftLocal(); }
});
document.getElementById('clausulas-container').addEventListener('change', e=>{
  const id = e.target.getAttribute('data-clause-select');
  if(id){
    STATE.clausulasSelecionadas[id] = e.target.value;
    STATE.clausulasEditadoManualmente[id] = false;
    STATE.clausulasTextoAtual[id] = substituir(textoClausulaSelecionada(id), montarContexto());
    renderClausulas(); saveDraftLocal();
  }
});
document.getElementById('clausulas-container').addEventListener('click', e=>{
  const idSave = e.target.getAttribute('data-clause-save');
  const idReset = e.target.getAttribute('data-clause-reset');
  if(idSave){
    const nome = prompt('Nome para esta cláusula personalizada:', 'Personalizada');
    if(!nome) return;
    CONFIG.clausulasPersonalizadas[idSave] = CONFIG.clausulasPersonalizadas[idSave] || [];
    CONFIG.clausulasPersonalizadas[idSave].push({ nome, texto: STATE.clausulasTextoAtual[idSave] });
    STATE.clausulasSelecionadas[idSave] = 'custom-'+(CONFIG.clausulasPersonalizadas[idSave].length-1);
    STATE.clausulasEditadoManualmente[idSave] = false;
    saveConfigLocal(); renderClausulas(); saveDraftLocal();
  }
  if(idReset){
    STATE.clausulasSelecionadas[idReset] = 'padrao';
    STATE.clausulasEditadoManualmente[idReset] = false;
    STATE.clausulasTextoAtual[idReset] = substituir(textoClausulaPadrao(idReset), montarContexto());
    renderClausulas(); saveDraftLocal();
  }
});

function montarTextoCompleto(){
  sincronizarClausulasNaoEditadas();
  const preambulo = `Por este instrumento particular, de um lado denominado ARRENDANTE: ${qualificacao('arrendante')}; e do outro lado denominado ARRENDATÁRIO(A): ${qualificacao('arrendatario')}; têm entre si, por justo e contratado, o presente CONTRATO DE ARRENDAMENTO DE AUTOMÓVEL DE PRAZO DETERMINADO, mediante as cláusulas e condições a seguir, que mútua e reciprocamente outorgam e aceitam:`;
  const clausulas = Object.keys(CLAUSE_LABELS).map(id => `${CLAUSE_LABELS[id]} – ${STATE.clausulasTextoAtual[id]}`).join('\n\n');
  const encerramento = `E, por estarem justas e contratadas, as partes firmam o presente instrumento em 2 (duas) vias de igual teor e forma, para que produza os seus efeitos legais.\n\n${STATE.comarca}, ${dataExtenso(STATE.dataAtual)}.\n\n\n_________________________________\n${nomeAssinante('arrendante')}\nARRENDANTE\n\n\n_________________________________\n${nomeAssinante('arrendatario')}\nARRENDATÁRIO(A)\n\nReconhecer firma por: ${STATE.tipoFirma}`;
  return `CONTRATO DE ARRENDAMENTO DE AUTOMÓVEL DE PRAZO DETERMINADO\n\n${preambulo}\n\n${clausulas}\n\n${encerramento}`;
}
