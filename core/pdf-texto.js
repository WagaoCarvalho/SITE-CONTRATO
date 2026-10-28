/* =========================================================================
   MOTOR DE TEXTO PARA PDF — genérico e reutilizável, sem conhecimento de
   contrato/cláusulas. Faz quebra de linha, justificação e negrito +
   sublinhado automático para segmentos marcados como "dinâmicos".
   Único acoplamento externo: a API de desenho do jsPDF (doc.text/doc.line/
   doc.getTextWidth/doc.setFont), recebida de fora.
   ========================================================================= */
function criarMotorTextoPDF(doc, opcoes) {
  const { margin, maxWidth, pageHeight, fam, lh } = opcoes;
  let y = margin;

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

    while (atual.length && atual[atual.length - 1].isSpace) atual.pop();
    if (atual.length) linhas.push(atual);
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
    const extra = (justificar && nEsp > 0) ? (maxWidth - natural) / nEsp : 0;

    let x = margin;
    doc.setLineWidth(0.15);

    linha.forEach(t => {
      if (t.isSpace) {
        if (t.sublinhar) doc.line(x, y + 0.8, x + t.w + extra, y + 0.8);
        x += t.w + extra;
        return;
      }
      doc.setFont(fam, t.bold ? 'bold' : 'normal');
      doc.text(t.text, x, y);
      if (t.sublinhar) doc.line(x, y + 0.8, x + t.w, y + 0.8);
      x += t.w;
    });

    y += lh;
  }

  // Um "parágrafo" = lista de segmentos {text, bold, semSublinhado}
  function escreverSegmentos(segmentos) {
    const chunks = [[]];

    segmentos.forEach(s => {
      s.text.split('\n').forEach((parte, i) => {
        if (i > 0) chunks.push([]);
        parte.split(/(\s+)/).filter(t => t !== '').forEach(t => {
          chunks[chunks.length - 1].push({
            text: t,
            bold: s.bold,
            isSpace: /^\s+$/.test(t),
            sublinhar: !!(s.bold && !s.semSublinhado)
          });
        });
      });
    });

    chunks.forEach(tokens => {
      if (!tokens.length) return;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].isSpace) {
          tokens[i].sublinhar = !!(tokens[i - 1] && tokens[i - 1].sublinhar && tokens[i + 1] && tokens[i + 1].sublinhar);
        }
      }
      const linhas = quebrarEmLinhas(tokens);
      linhas.forEach((l, idx) => desenharLinha(l, idx < linhas.length - 1));
    });

    y += lh * 0.6;
  }

  function escreverCentralizadoNegrito(texto, yPos, sublinhar) {
    doc.setFont(fam, 'bold');
    doc.text(texto, 105, yPos, { align: 'center' });
    if (sublinhar) {
      const w = doc.getTextWidth(texto);
      doc.line(105 - w / 2, yPos + 1, 105 + w / 2, yPos + 1);
    }
  }

  function quebrarPaginaSeNecessario(alturaNecessaria) {
    if (y + alturaNecessaria > pageHeight) {
      doc.addPage();
      y = margin;
    }
  }

  return {
    get y() { return y; },
    set y(v) { y = v; },
    margin, maxWidth, pageHeight, lh,
    escreverSegmentos,
    escreverCentralizadoNegrito,
    quebrarPaginaSeNecessario
  };
}
