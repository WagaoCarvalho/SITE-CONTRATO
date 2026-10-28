/* =========================================================================
   TIPOS DE CONTRATO — registro declarativo (Arrendamento, Comodato, e os
   que o usuário cadastrar). Cada tipo define papéis, título do documento
   e cláusulas padrão. Função pura; nenhum efeito colateral aqui.

   As cláusulas usam os placeholders {{PAPEL_A}} / {{PAPEL_B}} (substituídos
   dinamicamente pelos papéis do tipo) além dos placeholders normais do
   contrato ({{LISTA_VEICULOS}}, {{DATA_INICIO}}, etc. — ver core/contrato.js).
   ========================================================================= */

const TIPOS_CONTRATO_PADRAO = {
  arrendamento: {
    nome: 'Arrendamento',
    titulo: 'CONTRATO DE ARRENDAMENTO DE AUTOMÓVEL DE PRAZO DETERMINADO',
    papelA: 'ARRENDANTE',
    papelB: 'ARRENDATÁRIO(A)',
    clausulas: [
      'O(A) {{PAPEL_A}} é proprietário(a) do(s) seguinte(s) veículo(s), objeto deste contrato:\n{{LISTA_VEICULOS}}',
      'O(A) {{PAPEL_A}} cede em arrendamento ao(à) {{PAPEL_B}} o(s) veículo(s) descrito(s) na cláusula anterior, para uso exclusivo na execução das atividades do(a) {{PAPEL_B}}, incluindo transporte, locomoção e demais serviços correlatos às suas atividades.',
      'O presente contrato de arrendamento vigora por prazo determinado, com início em {{DATA_INICIO}} e término em {{DATA_FIM}}, data em que se extinguirá automaticamente, independentemente de aviso ou notificação, salvo renovação expressa entre as partes.',
      'O(A) {{PAPEL_B}} poderá proceder com o(s) veículo(s) ora arrendado(s) ao registro perante a Agência Nacional de Transportes Terrestres (ANTT), não havendo qualquer impedimento por parte do(a) {{PAPEL_A}}, bem como poderá cumprir as exigências legais pertinentes, contratar e subcontratar fretes, receber, pagar e dar quitação de fretes e demais serviços direta ou indiretamente relacionados ao(s) veículo(s) objeto deste instrumento.',
      'O(A) {{PAPEL_B}} não poderá transferir, ceder ou sublocar a terceiros, a qualquer título, o(s) veículo(s) objeto deste contrato.',
      'As despesas necessárias para o registro mencionado na cláusula quarta ficarão a cargo do(a) {{PAPEL_B}}.',
      'Fica eleito o foro da comarca de {{COMARCA}} como único competente para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.'
    ]
  },
  comodato: {
    nome: 'Comodato',
    titulo: 'CONTRATO DE COMODATO DE AUTOMÓVEL DE PRAZO DETERMINADO',
    papelA: 'COMODANTE',
    papelB: 'COMODATÁRIO(A)',
    clausulas: [
      'O(A) {{PAPEL_A}} é proprietário(a) do(s) seguinte(s) veículo(s), objeto deste contrato:\n{{LISTA_VEICULOS}}',
      'O(A) {{PAPEL_A}} entrega ao(à) {{PAPEL_B}}, a título gratuito, a título de comodato, o(s) veículo(s) descrito(s) na cláusula anterior, para uso exclusivo do(a) {{PAPEL_B}}, sem qualquer contraprestação financeira.',
      'O presente contrato de comodato vigora por prazo determinado, com início em {{DATA_INICIO}} e término em {{DATA_FIM}}, data em que o(s) veículo(s) deverá(ão) ser restituído(s) ao(à) {{PAPEL_A}}, salvo renovação expressa entre as partes.',
      'O(A) {{PAPEL_B}} obriga-se a zelar pela conservação do(s) veículo(s), respondendo por qualquer dano, avaria ou perda ocorrida durante a vigência deste contrato, bem como pelas despesas de manutenção, combustível e multas decorrentes do uso.',
      'O(A) {{PAPEL_B}} não poderá transferir, ceder, sublocar ou emprestar a terceiros, a qualquer título, o(s) veículo(s) objeto deste contrato, sem autorização expressa e por escrito do(a) {{PAPEL_A}}.',
      'Ao término do prazo estabelecido, o(a) {{PAPEL_B}} deverá restituir o(s) veículo(s) ao(à) {{PAPEL_A}} nas mesmas condições em que o(s) recebeu, ressalvado o desgaste natural pelo uso regular.',
      'Fica eleito o foro da comarca de {{COMARCA}} como único competente para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.'
    ]
  }
};

/* Monta o objeto de cláusulas padrão (chaves c1..cN) a partir do array
   declarado acima — formato usado por CONFIG.tiposContrato[tipo].clausulasPadrao */
function clausulasPadraoDoTipo(tipoDef) {
  const resultado = {};
  tipoDef.clausulas.forEach((texto, i) => {
    resultado['c' + (i + 1)] = texto.replace(/{{PAPEL_A}}/g, tipoDef.papelA).replace(/{{PAPEL_B}}/g, tipoDef.papelB);
  });
  return resultado;
}

/* Gera a entrada completa de CONFIG.tiposContrato para um tipo padrão ou
   recém-cadastrado pelo usuário. */
function construirEntradaTipoContrato(def) {
  return {
    nome: def.nome,
    titulo: def.titulo,
    papelA: def.papelA,
    papelB: def.papelB,
    clausulasPadrao: def.clausulasPadrao || clausulasPadraoDoTipo(def),
    clausulasPersonalizadas: def.clausulasPersonalizadas || {}
  };
}

function tiposContratoPadrao() {
  const resultado = {};
  Object.keys(TIPOS_CONTRATO_PADRAO).forEach(chave => {
    resultado[chave] = construirEntradaTipoContrato(TIPOS_CONTRATO_PADRAO[chave]);
  });
  return resultado;
}
