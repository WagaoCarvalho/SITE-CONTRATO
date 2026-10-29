/* =========================================================================
   UI: NAVEGAÇÃO ENTRE ETAPAS E ABAS, GERAÇÃO DO PDF.
   Sem export/import de arquivo: o rascunho fica salvo automaticamente
   (infra/estado.js) só por preencher o formulário. O preview do contrato
   usa o PDF real (mesma formatação do impresso), não um texto simples.
   ========================================================================= */
function mostrarEtapa(n) {
  document.getElementById('step-form').style.display = n === 1 ? 'block' : 'none';
  document.getElementById('step-pdf').style.display = n === 2 ? 'block' : 'none';
  [1, 2].forEach(i => document.getElementById('step-ind-' + i).classList.toggle('current', i === n));
}

document.getElementById('btn-gerar-pdf').addEventListener('click', () => {
  if (validarFormulario(STATE).length) return;
  const { doc, blobUrl } = gerarPDFComPreview();
  window._ultimoPDF = doc;
  document.getElementById('preview-pdf').src = blobUrl;
  document.getElementById('texto-final').textContent = montarTextoCompleto(STATE, CONFIG);
  mostrarEtapa(2);
});
document.getElementById('btn-voltar-form-topo').addEventListener('click', () => mostrarEtapa(1));
document.getElementById('btn-voltar-form-clausulas').addEventListener('click', () => {
  document.querySelector('nav.tabs button[data-tab="formulario"]').click();
});
document.getElementById('btn-baixar-pdf').addEventListener('click', () => {
  const doc = window._ultimoPDF || gerarDocumentoPDF();
  doc.save(nomeArquivoPdf());
});

// Regra de nome do arquivo:
//  - 1 veículo  → "PLACA_CONTRATO.pdf"   (ex.: ABC1D23_CONTRATO.pdf)
//  - 2+ veículos → "CONTRATO.pdf"
function nomeArquivoPdf() {
  const veiculos = (STATE && STATE.veiculos) || [];
  if (veiculos.length === 1) {
    const placa = (veiculos[0].placa || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (placa) return `${placa}_CONTRATO.pdf`;
  }
  return 'CONTRATO.pdf';
}

document.getElementById('btn-mostrar-texto').addEventListener('click', () => {
  const bloco = document.getElementById('bloco-texto-copiavel');
  bloco.style.display = bloco.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('btn-copiar-texto').addEventListener('click', () => {
  const texto = document.getElementById('texto-final').textContent;
  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.getElementById('btn-copiar-texto');
    const original = btn.textContent; btn.textContent = 'Copiado!';
    setTimeout(() => btn.textContent = original, 1500);
  });
});
document.getElementById('btn-novo-contrato').addEventListener('click', () => {
  if (!confirm('Iniciar um novo contrato? O rascunho atual será substituído.')) return;
  STATE = estadoInicial(); saveDraftLocal(); renderTudo(); mostrarEtapa(1);
});
document.getElementById('btn-limpar-form').addEventListener('click', () => {
  if (!confirm('Limpar todos os campos do formulário?')) return;
  STATE = estadoInicial(); saveDraftLocal(); renderTudo();
});

document.querySelectorAll('nav.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('main .view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + btn.getAttribute('data-tab')).classList.add('active');
    if (btn.getAttribute('data-tab') === 'clausulas') renderClausulas();
  });
});

/* Link do menu para o gateway (portal da intranet na porta 80 do mesmo
   servidor). O endereço é montado a partir de onde a página foi aberta, então
   funciona por nome (mandaquiserver), IP ou Tailscale sem configurar nada. */
document.getElementById('link-gateway').href = `${location.protocol}//${location.hostname}/`;
