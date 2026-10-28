/* =========================================================================
   DOMÍNIO: contrato (texto, cláusulas, estado inicial).
   Funções puras — recebem STATE/CONFIG como argumento, não tocam DOM.
   Generalizado para qualquer tipo de contrato registrado em
   CONFIG.tiposContrato (Arrendamento, Comodato, ou outro cadastrado).
   ========================================================================= */
function estadoInicial() {
  const hoje = new Date();
  const fim = new Date(hoje); fim.setFullYear(fim.getFullYear() + 5);
  return {
    tipoContrato: 'arrendamento',
    tipoArrendante: 'PF', tipoArrendatario: 'PJ',
    arrendante: dadosIniciaisParte(), arrendatario: dadosIniciaisParte(),
    dataAtual: hoje.toISOString().slice(0, 10),
    prazoInicio: hoje.toISOString().slice(0, 10),
    prazoFim: fim.toISOString().slice(0, 10),
    comarca: 'SÃO PAULO',
    tipoFirma: 'SEMELHANÇA',
    veiculos: [],
    clausulasSelecionadas: {},
    clausulasTextoAtual: {},
    clausulasEditadoManualmente: {}
  };
}

function tipoContratoAtual(STATE, CONFIG) {
  return CONFIG.tiposContrato[STATE.tipoContrato] || Object.values(CONFIG.tiposContrato)[0];
}

function qualificacao(STATE, CONFIG, prefixo) {
  const tipo = prefixo === 'arrendante' ? STATE.tipoArrendante : STATE.tipoArrendatario;
  const papel = prefixo === 'arrendante' ? tipoContratoAtual(STATE, CONFIG).papelA : tipoContratoAtual(STATE, CONFIG).papelB;
  return TIPOS_PARTE[tipo].qualificar(STATE[prefixo], papel);
}
function qualificacaoSegmentos(STATE, CONFIG, prefixo) {
  const tipo = prefixo === 'arrendante' ? STATE.tipoArrendante : STATE.tipoArrendatario;
  const papel = prefixo === 'arrendante' ? tipoContratoAtual(STATE, CONFIG).papelA : tipoContratoAtual(STATE, CONFIG).papelB;
  return TIPOS_PARTE[tipo].qualificarSegmentos(STATE[prefixo], papel);
}
function nomeAssinante(STATE, prefixo) {
  const tipo = prefixo === 'arrendante' ? STATE.tipoArrendante : STATE.tipoArrendatario;
  const d = STATE[prefixo];
  return tipo === 'PF' ? d.nome : d.socioSelecionado;
}
function listaVeiculosTexto(STATE) {
  return STATE.veiculos.map(v => `• Placa: ${v.placa}, Marca/Modelo: ${v.marca}, Ano: ${v.ano || '-'}, Chassis: ${v.chassis || '-'}.`).join('\n');
}
function montarContexto(STATE, CONFIG) {
  const tipo = tipoContratoAtual(STATE, CONFIG);
  return {
    LISTA_VEICULOS: listaVeiculosTexto(STATE),
    DATA_INICIO: dataBR(STATE.prazoInicio),
    DATA_FIM: dataBR(STATE.prazoFim),
    COMARCA: STATE.comarca,
    PAPEL_A: tipo.papelA,
    PAPEL_B: tipo.papelB
  };
}
function substituir(texto, ctx) {
  return texto.replace(/{{(\w+)}}/g, (_, k) => ctx[k] !== undefined ? ctx[k] : `{{${k}}}`);
}

/* ---- Versão "segmentada" (para negritar/sublinhar só as informações dinâmicas no PDF) ---- */
function seg(t) { return { text: t, bold: false }; }
function dyn(t) { return { text: String(t), bold: true }; }
function segmentosListaVeiculos(STATE) {
  const arr = [];
  STATE.veiculos.forEach(v => {
    arr.push(seg('• Placa: '), dyn(v.placa), seg(', Ano: '), dyn(v.ano || '-'), seg(', Marca/Modelo: '), dyn(v.marca), seg(', Chassis: '), dyn(v.chassis || '-'), seg('.\n'));
  });
  return arr;
}
function montarContextoSegmentado(STATE, CONFIG) {
  const tipo = tipoContratoAtual(STATE, CONFIG);
  return {
    LISTA_VEICULOS: segmentosListaVeiculos(STATE),
    DATA_INICIO: dyn(dataBR(STATE.prazoInicio)),
    DATA_FIM: dyn(dataBR(STATE.prazoFim)),
    COMARCA: dyn(STATE.comarca),
    PAPEL_A: seg(tipo.papelA),
    PAPEL_B: seg(tipo.papelB)
  };
}
function segmentarTemplate(template, ctxSeg) {
  const partes = template.split(/({{\w+}})/g);
  const resultado = [];
  partes.forEach(p => {
    const m = p.match(/^{{(\w+)}}$/);
    if (m) {
      const val = ctxSeg[m[1]];
      if (Array.isArray(val)) resultado.push(...val);
      else if (val !== undefined) resultado.push(val);
      else resultado.push(seg(p));
    } else if (p) resultado.push(seg(p));
  });
  return resultado;
}

function idsClausulas(CONFIG, STATE) {
  return Object.keys(tipoContratoAtual(STATE, CONFIG).clausulasPadrao);
}
function textoClausulaPadrao(CONFIG, STATE, id) { return tipoContratoAtual(STATE, CONFIG).clausulasPadrao[id]; }
function opcoesClausula(CONFIG, STATE, id) {
  const personalizadas = tipoContratoAtual(STATE, CONFIG).clausulasPersonalizadas[id] || [];
  return [{ chave: 'padrao', nome: 'Padrão' }, ...personalizadas.map((c, i) => ({ chave: 'custom-' + i, nome: c.nome }))];
}
function textoClausulaSelecionada(STATE, CONFIG, id) {
  const sel = STATE.clausulasSelecionadas[id] || 'padrao';
  if (sel === 'padrao') return textoClausulaPadrao(CONFIG, STATE, id);
  const idx = Number(sel.replace('custom-', ''));
  const c = (tipoContratoAtual(STATE, CONFIG).clausulasPersonalizadas[id] || [])[idx];
  return c ? c.texto : textoClausulaPadrao(CONFIG, STATE, id);
}

/* Garante que STATE tenha entradas de seleção/edição para toda cláusula do
   tipo de contrato atual (necessário ao trocar de tipo, já que cada tipo
   pode ter um número diferente de cláusulas). */
function garantirEstruturaClausulas(STATE, CONFIG) {
  idsClausulas(CONFIG, STATE).forEach(id => {
    if (STATE.clausulasSelecionadas[id] === undefined) STATE.clausulasSelecionadas[id] = 'padrao';
    if (STATE.clausulasEditadoManualmente[id] === undefined) STATE.clausulasEditadoManualmente[id] = false;
  });
}

function sincronizarClausulasNaoEditadas(STATE, CONFIG) {
  garantirEstruturaClausulas(STATE, CONFIG);
  const ctx = montarContexto(STATE, CONFIG);
  idsClausulas(CONFIG, STATE).forEach(id => {
    if (!STATE.clausulasEditadoManualmente[id]) {
      STATE.clausulasTextoAtual[id] = substituir(textoClausulaSelecionada(STATE, CONFIG, id), ctx);
    }
  });
}

function montarTextoCompleto(STATE, CONFIG) {
  sincronizarClausulasNaoEditadas(STATE, CONFIG);
  const tipo = tipoContratoAtual(STATE, CONFIG);
  const preambulo = `Por este instrumento particular, de um lado denominado ${tipo.papelA}: ${qualificacao(STATE, CONFIG, 'arrendante')}; e do outro lado denominado ${tipo.papelB}: ${qualificacao(STATE, CONFIG, 'arrendatario')}; têm entre si, por justo e contratado, o presente ${tipo.titulo}, mediante as cláusulas e condições a seguir, que mútua e reciprocamente outorgam e aceitam:`;
  const clausulas = idsClausulas(CONFIG, STATE).map((id, i) => `${rotuloClausula(i)} - ${STATE.clausulasTextoAtual[id]}`).join('\n\n');
  const encerramento = `E, por estarem justas e contratadas, as partes firmam o presente instrumento em 2 (duas) vias de igual teor e forma, para que produza os seus efeitos legais.\n\n${STATE.comarca}, ${dataExtenso(STATE.dataAtual)}.\n\n\n_________________________________\n${nomeAssinante(STATE, 'arrendante')}\n${tipo.papelA}\n\n\n_________________________________\n${nomeAssinante(STATE, 'arrendatario')}\n${tipo.papelB}\n\nReconhecer firma por: ${STATE.tipoFirma}`;
  return `${tipo.titulo}\n\n${preambulo}\n\n${clausulas}\n\n${encerramento}`;
}
