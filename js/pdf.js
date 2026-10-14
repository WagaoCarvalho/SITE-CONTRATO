/* =========================================================================
   MÓDULO: PDF
   Layout: texto justificado; informações dinâmicas em negrito + sublinhado;
   rótulos "CLÁUSULA X -" em negrito; assinaturas em 2 colunas sem caixa.
   ========================================================================= */
function gerarPDF() {
  sincronizarClausulasNaoEditadas();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const fam = CONFIG.fonte.familia;
  const margin = 15, maxWidth = 210 - margin * 2, pageHeight = 297 - margin;
  let y = margin;

  doc.setFontSize(CONFIG.fonte.tamanho + 2);
  doc.setFont(fam, 'bold');

  const titulo = doc.splitTextToSize(
    'CONTRATO DE ARRENDAMENTO DE AUTOMÓVEL DE PRAZO DETERMINADO',
    maxWidth
  );

  titulo.forEach(l => {
    doc.text(l, 105, y, { align: 'center' });
    y += 6;
  });

  y += 4;

  doc.setFontSize(CONFIG.fonte.tamanho);

  const lh = CONFIG.fonte.tamanho * 0.3528 * 1.3;

  function larguraToken(t) {
    doc.setFont(fam, t.bold ? 'bold' : 'normal');
    return doc.getTextWidth(t.text);
  }

  // Quebra os tokens em linhas que cabem em maxWidth
  function quebrarEmLinhas(tokens) {
    const linhas = [];
    let atual = [];
    let larg = 0;

    tokens.forEach(t => {
      t.w = larguraToken(t);

      if (t.isSpace) {
        if (atual.length === 0) return;

        if (larg + t.w > maxWidth) {
          linhas.push(atual);
          atual = [];
          larg = 0;
          return;
        }

        atual.push(t);
        larg += t.w;
        return;
      }

      if (larg + t.w > maxWidth && atual.length) {
        while (atual.length && atual[atual.length - 1].isSpace) {
          larg -= atual.pop().w;
        }

        linhas.push(atual);
        atual = [];
        larg = 0;
      }

      atual.push(t);
      larg += t.w;
    });

    while (atual.length && atual[atual.length - 1].isSpace) {
      atual.pop();
    }

    if (atual.length) {
      linhas.push(atual);
    }

    return linhas;
  }

  // Desenha uma linha; se "justificar", distribui a folga entre os espaços
  function desenharLinha(linha, justificar) {
    if (y > pageHeight) {
      doc.addPage();
      y = margin;
    }

    const natural = linha.reduce((s, t) => s + t.w, 0);
    const nEsp = linha.filter(t => t.isSpace).length;

    const extra = (
      justificar && nEsp > 0
    )
      ? (maxWidth - natural) / nEsp
      : 0;

    let x = margin;

    doc.setLineWidth(0.15);

    linha.forEach(t => {
      if (t.isSpace) {
        if (t.sublinhar) {
          doc.line(
            x,
            y + 0.8,
            x + t.w + extra,
            y + 0.8
          );
        }

        x += t.w + extra;
        return;
      }

      doc.setFont(
        fam,
        t.bold ? 'bold' : 'normal'
      );

      doc.text(
        t.text,
        x,
        y
      );

      if (t.sublinhar) {
        doc.line(
          x,
          y + 0.8,
          x + t.w,
          y + 0.8
        );
      }

      x += t.w;
    });

    y += lh;
  }

  // Um "parágrafo" = lista de segmentos
  function escreverSegmentos(segmentos) {
    const chunks = [[]];

    segmentos.forEach(s => {
      s.text.split('\n').forEach((parte, i) => {
        if (i > 0) {
          chunks.push([]);
        }

        parte
          .split(/(\s+)/)
          .filter(t => t !== '')
          .forEach(t => {
            chunks[chunks.length - 1].push({
              text: t,
              bold: s.bold,
              isSpace: /^\s+$/.test(t),
              sublinhar: !!(
                s.bold &&
                !s.semSublinhado
              )
            });
          });
      });
    });

    chunks.forEach(tokens => {
      if (!tokens.length) return;

      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].isSpace) {
          tokens[i].sublinhar = !!(
            tokens[i - 1] &&
            tokens[i - 1].sublinhar &&
            tokens[i + 1] &&
            tokens[i + 1].sublinhar
          );
        }
      }

      const linhas = quebrarEmLinhas(tokens);

      linhas.forEach((l, idx) => {
        desenharLinha(
          l,
          idx < linhas.length - 1
        );
      });
    });

    y += lh * 0.6;
  }

  function escreverCentralizadoNegrito(
    texto,
    yPos,
    sublinhar
  ) {
    doc.setFont(
      fam,
      'bold'
    );

    doc.text(
      texto,
      105,
      yPos,
      { align: 'center' }
    );

    if (sublinhar) {
      const w = doc.getTextWidth(texto);

      doc.line(
        105 - w / 2,
        yPos + 1,
        105 + w / 2,
        yPos + 1
      );
    }
  }

  // -----------------------------------------------------------------------
  // CPF / CNPJ DO ASSINANTE
  // -----------------------------------------------------------------------
  function documentoAssinante(prefixo) {
    const tipo = prefixo === 'arrendante'
      ? STATE.tipoArrendante
      : STATE.tipoArrendatario;

    const dados = STATE[prefixo];

    if (tipo === 'PF') {
      return formatCPF(
        dados.cpf || ''
      );
    }

    return formatCNPJ(
      dados.cnpj || ''
    );
  }

  const ctxSeg = montarContextoSegmentado();
  const ctxTexto = montarContexto();

  // -----------------------------------------------------------------------
  // PREÂMBULO
  // -----------------------------------------------------------------------
  escreverSegmentos([
    seg(
      'Por este instrumento particular, de um lado denominado ARRENDANTE: '
    ),

    ...qualificacaoSegmentos(
      'arrendante'
    ),

    seg(
      '; e do outro lado denominado ARRENDATÁRIO(A): '
    ),

    ...qualificacaoSegmentos(
      'arrendatario'
    ),

    seg(
      '; têm entre si, por justo e contratado, o presente CONTRATO DE ARRENDAMENTO DE AUTOMÓVEL DE PRAZO DETERMINADO, mediante as cláusulas e condições a seguir, que mútua e reciprocamente outorgam e aceitam:'
    )
  ]);

  // -----------------------------------------------------------------------
  // CLÁUSULAS
  // -----------------------------------------------------------------------
  Object.keys(CLAUSE_LABELS).forEach(id => {
    const rotulo = {
      text: CLAUSE_LABELS[id] + ' - ',
      bold: true,
      semSublinhado: true
    };

    if (!STATE.clausulasEditadoManualmente[id]) {
      escreverSegmentos([
        rotulo,

        ...segmentarTemplate(
          textoClausulaSelecionada(id),
          ctxSeg
        )
      ]);
    } else {
      escreverSegmentos([
        rotulo,
        seg(
          STATE.clausulasTextoAtual[id]
        )
      ]);
    }
  });

  // -----------------------------------------------------------------------
  // ENCERRAMENTO
  // -----------------------------------------------------------------------
  const alturaBlocoFinal = 60;

  if (y + alturaBlocoFinal > pageHeight) {
    doc.addPage();
    y = margin;
  }

  escreverSegmentos([
    seg(
      'E, por estarem justas e contratadas, as partes firmam o presente instrumento em 2 (duas) vias de igual teor e forma, para que produza os seus efeitos legais.'
    )
  ]);

  y += 4;

  escreverCentralizadoNegrito(
    `${ctxTexto.COMARCA}, ${dataExtenso(STATE.dataAtual)}`.toUpperCase(),
    y,
    false
  );

  y += 24;

  // -----------------------------------------------------------------------
  // ASSINATURAS
  //
  // NOME DO ASSINANTE
  // -----------------
  //
  // -----------------
  // CPF/CNPJ
  //
  // Reconhecer firma por: ...
  // -----------------------------------------------------------------------

  const colWidth = (maxWidth - 12) / 2;

  const colXEsq = margin;

  const colXDir =
    margin + colWidth + 12;

  [
    {
      x: colXEsq,
      centro: colXEsq + colWidth / 2,
      prefixo: 'arrendante'
    },

    {
      x: colXDir,
      centro: colXDir + colWidth / 2,
      prefixo: 'arrendatario'
    }
  ].forEach(col => {

    let yy = y;

    const nome =
      nomeAssinante(col.prefixo);

    const documento =
      documentoAssinante(col.prefixo);



    // ---------------------------------------------------------------
    // LINHA PARA ASSINATURA
    // ---------------------------------------------------------------
    doc.setLineWidth(0.2);

    doc.line(
      col.x,
      yy,
      col.x + colWidth,
      yy
    );

    yy += 5;

    // ---------------------------------------------------------------
    // NOME
    // Negrito + sublinhado
    // ---------------------------------------------------------------
    doc.setFont(
      fam,
      'bold'
    );

    const nomeW =
      doc.getTextWidth(nome);

    doc.text(
      nome,
      col.centro,
      yy,
      {
        align: 'center'
      }
    );
    doc.setLineWidth(0.15);

    yy += 5;

    // ---------------------------------------------------------------
    // CPF / CNPJ
    // ---------------------------------------------------------------
    doc.setFont(
      fam,
      'bold'
    );

    doc.text(
      documento,
      col.centro,
      yy,
      {
        align: 'center'
      }
    );

    yy += 8;

    // ---------------------------------------------------------------
    // RECONHECER FIRMA
    // ---------------------------------------------------------------
    const textoFirma =
      `Reconhecer firma por: ${STATE.tipoFirma}`;

    doc.text(
      textoFirma,
      col.centro,
      yy,
      {
        align: 'center'
      }
    );
  });

  return doc;
}