/* =========================================================================
   MÓDULO: ESTADO DO FORMULÁRIO (rascunho do contrato)
   ========================================================================= */
function estadoInicial() {
  const hoje = new Date();
  const fim = new Date(hoje); fim.setFullYear(fim.getFullYear() + 5);
  return {
    tipoArrendante: 'PF', tipoArrendatario: 'PJ',
    arrendante: {
      nome: '', cpf: '', nacionalidade: 'BRASILEIRO', profissao: 'AUTÔNOMO', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '',
      cnpj: '', nomeEmpresa: '', socios: [], socioSelecionado: ''
    },
    arrendatario: {
      nome: '', cpf: '', nacionalidade: 'BRASILEIRO', profissao: 'AUTÔNOMO', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '',
      cnpj: '', nomeEmpresa: '', socios: [], socioSelecionado: ''
    },
    dataAtual: hoje.toISOString().slice(0, 10),
    prazoInicio: hoje.toISOString().slice(0, 10),
    prazoFim: fim.toISOString().slice(0, 10),
    comarca: 'SÃO PAULO',
    tipoFirma: 'SEMELHANÇA',
    veiculos: [],
    clausulasSelecionadas: { c1: 'padrao', c2: 'padrao', c3: 'padrao', c4: 'padrao', c5: 'padrao', c6: 'padrao', c7: 'padrao' },
    clausulasTextoAtual: {},
    clausulasEditadoManualmente: { c1: false, c2: false, c3: false, c4: false, c5: false, c6: false, c7: false }
  };
}

function loadDraftLocal() {
  try { const raw = localStorage.getItem('contrato_rascunho'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function saveDraftLocal() { localStorage.setItem('contrato_rascunho', JSON.stringify(STATE)); }

// Mescla com o estado inicial para não quebrar se um rascunho antigo não tiver campos novos.
let STATE = Object.assign(estadoInicial(), loadDraftLocal() || {});
if (!STATE.clausulasEditadoManualmente) {
  STATE.clausulasEditadoManualmente = { c1: false, c2: false, c3: false, c4: false, c5: false, c6: false, c7: false };
}
