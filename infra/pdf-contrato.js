/* =========================================================================
   MONTAGEM DO PDF DO CONTRATO — usa o motor genérico (core/pdf-texto.js) +
   o conteúdo do contrato (core/contrato.js). Gera tanto o arquivo para
   download quanto uma URL de blob para preview visual idêntico ao
   impresso (ui/navigation.js exibe essa URL num <iframe>).
   ========================================================================= */
function documentoAssinante(prefixo) {
  const tipo = prefixo === 'arrendante' ? STATE.tipoArrendante : STATE.tipoArrendatario;
  const dados = STATE[prefixo];
  return tipo === 'PF' ? formatCPF(dados.cpf || '') : formatCNPJ(dados.cnpj || '');
}

function gerarDocumentoPDF() {
  sincronizarClausulasNaoEditadas(STATE, CONFIG);
  const tipoContrato = tipoContratoAtual(STATE, CONFIG);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const fam = CONFIG.fonte.familia;
  const margin = LAYOUT_PDF.MARGEM_MM;
  const maxWidth = LAYOUT_PDF.PAGINA_LARGURA_MM - margin * 2;
  const pageHeight = LAYOUT_PDF.PAGINA_ALTURA_MM - margin;
  const lh = CONFIG.fonte.tamanho * 0.3528 * LAYOUT_PDF.ENTRELINHA_FATOR;

  doc.setFontSize(CONFIG.fonte.tamanho + 2);
  doc.setFont(fam, 'bold');
  let y = margin;
  doc.splitTextToSize(tipoContrato.titulo, maxWidth).forEach(l => { doc.text(l, 105, y, { align: 'center' }); y += 6; });
  y += 4;
  doc.setFontSize(CONFIG.fonte.tamanho);

  const motor = criarMotorTextoPDF(doc, { margin, maxWidth, pageHeight, fam, lh });
  motor.y = y;

  const ctxSeg = montarContextoSegmentado(STATE, CONFIG);
  const ctxTexto = montarContexto(STATE, CONFIG);

  // PREÂMBULO
  motor.escreverSegmentos([
    seg(`Por este instrumento particular, de um lado denominado ${tipoContrato.papelA}: `),
    ...qualificacaoSegmentos(STATE, CONFIG, 'arrendante'),
    seg(`; e do outro lado denominado ${tipoContrato.papelB}: `),
    ...qualificacaoSegmentos(STATE, CONFIG, 'arrendatario'),
    seg(`; têm entre si, por justo e contratado, o presente ${tipoContrato.titulo}, mediante as cláusulas e condições a seguir, que mútua e reciprocamente outorgam e aceitam:`)
  ]);

  // CLÁUSULAS
  idsClausulas(CONFIG, STATE).forEach((id, i) => {
    const rotulo = { text: rotuloClausula(i) + ' - ', bold: true, semSublinhado: true };
    if (!STATE.clausulasEditadoManualmente[id]) {
      motor.escreverSegmentos([rotulo, ...segmentarTemplate(textoClausulaSelecionada(STATE, CONFIG, id), ctxSeg)]);
    } else {
      motor.escreverSegmentos([rotulo, seg(STATE.clausulasTextoAtual[id])]);
    }
  });

  // ENCERRAMENTO
  motor.quebrarPaginaSeNecessario(LAYOUT_PDF.ALTURA_RESERVADA_BLOCO_FINAL_MM);
  motor.escreverSegmentos([seg('E, por estarem justas e contratadas, as partes firmam o presente instrumento em 2 (duas) vias de igual teor e forma, para que produza os seus efeitos legais.')]);
  motor.y += 4;
  motor.escreverCentralizadoNegrito(`${ctxTexto.COMARCA}, ${dataExtenso(STATE.dataAtual)}`.toUpperCase(), motor.y, false);
  motor.y += 24;

  // ASSINATURAS (2 colunas)
  const colWidth = (maxWidth - 12) / 2;
  const colXEsq = margin;
  const colXDir = margin + colWidth + 12;
  const yAssinatura = motor.y;

  [
    { x: colXEsq, centro: colXEsq + colWidth / 2, prefixo: 'arrendante', papel: tipoContrato.papelA },
    { x: colXDir, centro: colXDir + colWidth / 2, prefixo: 'arrendatario', papel: tipoContrato.papelB }
  ].forEach(col => {
    let yy = yAssinatura;
    const nome = nomeAssinante(STATE, col.prefixo);
    const documento = documentoAssinante(col.prefixo);

    doc.setLineWidth(0.2);
    doc.line(col.x, yy, col.x + colWidth, yy);
    yy += 5;

    doc.setFont(fam, 'bold');
    doc.text(nome, col.centro, yy, { align: 'center' });
    doc.setLineWidth(0.15);
    yy += 5;

    doc.setFont(fam, 'bold');
    doc.text(documento, col.centro, yy, { align: 'center' });
    yy += 8;

    doc.text(`Reconhecer firma por: ${STATE.tipoFirma}`, col.centro, yy, { align: 'center' });
  });

  return doc;
}

/* Gera o PDF e retorna { doc, blobUrl } — blobUrl é usado no <iframe> de
   preview (mesma renderização exata do que será baixado) e revogado
   quando um novo PDF é gerado para não acumular memória. */
let _ultimoBlobUrlPDF = null;
function gerarPDFComPreview() {
  const doc = gerarDocumentoPDF();
  if (_ultimoBlobUrlPDF) URL.revokeObjectURL(_ultimoBlobUrlPDF);
  _ultimoBlobUrlPDF = doc.output('bloburl');
  return { doc, blobUrl: _ultimoBlobUrlPDF };
}
