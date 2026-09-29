/* =========================================================================
   MÓDULO: NAVEGAÇÃO ENTRE ETAPAS E ABAS
   ========================================================================= */
function mostrarEtapa(n){
  document.getElementById('step-form').style.display = n===1 ? 'block' : 'none';
  document.getElementById('step-pdf').style.display = n===2 ? 'block' : 'none';
  [1,2].forEach(i => document.getElementById('step-ind-'+i).classList.toggle('current', i===n));
}
document.getElementById('btn-gerar-pdf').addEventListener('click', ()=>{
  if(validarFormulario().length) return;
  const doc = gerarPDF();
  window._ultimoPDF = doc;
  document.getElementById('texto-final').textContent = montarTextoCompleto();
  mostrarEtapa(2);
});
document.getElementById('btn-voltar-form-topo').addEventListener('click', ()=>mostrarEtapa(1));
document.getElementById('btn-voltar-form-clausulas').addEventListener('click', ()=>{
  document.querySelector('nav.tabs button[data-tab="formulario"]').click();
});
document.getElementById('btn-baixar-pdf').addEventListener('click', ()=>{
  const doc = window._ultimoPDF || gerarPDF();
  doc.save(nomeArquivoPdf());
});

// Regra de nome do arquivo:
//  - 1 veículo  → "PLACA_CONTRATO.pdf"   (ex.: ABC1D23_CONTRATO.pdf)
//  - 2+ veículos → "CONTRATO.pdf"
function nomeArquivoPdf(){
  const veiculos = (STATE && STATE.veiculos) || [];
  if (veiculos.length === 1) {
    const placa = (veiculos[0].placa || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ''); // remove hífen, espaço, etc.
    if (placa) return `${placa}_CONTRATO.pdf`;
  }
  return 'CONTRATO.pdf';
}
document.getElementById('btn-copiar-texto').addEventListener('click', ()=>{
  const texto = document.getElementById('texto-final').textContent;
  navigator.clipboard.writeText(texto).then(()=>{
    const btn = document.getElementById('btn-copiar-texto');
    const original = btn.textContent; btn.textContent = 'Copiado!';
    setTimeout(()=>btn.textContent = original, 1500);
  });
});
document.getElementById('btn-novo-contrato').addEventListener('click', ()=>{
  if(!confirm('Iniciar um novo contrato? O rascunho atual será substituído.')) return;
  STATE = estadoInicial(); saveDraftLocal(); renderTudo(); mostrarEtapa(1);
});
document.getElementById('btn-limpar-form').addEventListener('click', ()=>{
  if(!confirm('Limpar todos os campos do formulário?')) return;
  STATE = estadoInicial(); saveDraftLocal(); renderTudo();
});

document.querySelectorAll('nav.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('main .view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+btn.getAttribute('data-tab')).classList.add('active');
    if(btn.getAttribute('data-tab')==='clausulas') renderClausulas();
  });
});

/* =========================================================================
   MÓDULO: EXPORTAR / IMPORTAR ARQUIVOS (rascunho e config)
   ========================================================================= */
function baixarJSON(obj, nomeArquivo){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nomeArquivo; a.click();
  URL.revokeObjectURL(url);
}
document.getElementById('btn-export-rascunho').addEventListener('click', ()=>baixarJSON(STATE, 'rascunho_contrato.json'));
document.getElementById('input-import-rascunho').addEventListener('change', e=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ STATE = JSON.parse(reader.result); saveDraftLocal(); renderTudo(); };
  reader.readAsText(file);
});
document.getElementById('btn-export-config').addEventListener('click', ()=>baixarJSON(CONFIG, 'config.json'));
document.getElementById('input-import-config').addEventListener('change', e=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ CONFIG = JSON.parse(reader.result); saveConfigLocal(); renderConfig(); };
  reader.readAsText(file);
});
document.getElementById('btn-reset-config').addEventListener('click', ()=>{
  if(!confirm('Restaurar todas as configurações para o padrão de fábrica?')) return;
  CONFIG = ConfigDefaults(); saveConfigLocal(); renderConfig();
});
