/* =========================================================================
   CONFIG — configurações do sistema: APIs, tipos de contrato/cláusulas,
   branding, fonte, cores. Carregada do localStorage na inicialização e,
   em seguida, sincronizada com o servidor (ver inicializarConfiguracao).
   ========================================================================= */
const ConfigDefaults = () => ({
  branding: Object.assign({}, BRANDING_PADRAO),
  cores: Object.assign({}, CORES_PADRAO),
  fonte: Object.assign({}, FONTE_PDF_PADRAO),
  apis: {
    cep: [
      { nome: 'ViaCEP', url: 'https://viacep.com.br/ws/{cep}/json/', chave: '', ativo: true },
      { nome: 'BrasilAPI', url: 'https://brasilapi.com.br/api/cep/v2/{cep}', chave: '', ativo: true },
      { nome: 'AwesomeAPI', url: 'https://cep.awesomeapi.com.br/json/{cep}', chave: '', ativo: true }
    ],
    cnpj: [
      { nome: 'ReceitaWS', url: 'https://receitaws.com.br/v1/cnpj/{cnpj}', chave: '', ativo: true },
      { nome: 'BrasilAPI', url: 'https://brasilapi.com.br/api/cnpj/v1/{cnpj}', chave: '', ativo: true }
    ],
    cpf: [
      { nome: 'ApiCPF', url: 'https://apicpf.com/api/consulta?cpf={cpf}', chave: '', ativo: true }
    ]
  },
  tiposContrato: tiposContratoPadrao()
});

function loadConfigLocal() {
  return lerLocal(CHAVES_LOCALSTORAGE.CONFIG, null);
}
/* Salva local imediatamente (síncrono) e, em paralelo, tenta sincronizar
   com o servidor em segundo plano (sem bloquear a UI e sem alertar o
   usuário em caso de falha — o servidor pode simplesmente não existir
   nesta instalação). Assim, cláusulas personalizadas e chaves de API
   ficam persistidas automaticamente, sem exigir export/import manual. */
function saveConfigLocal() {
  salvarLocal(CHAVES_LOCALSTORAGE.CONFIG, CONFIG);
  salvarConfigServidor(CONFIG).then(ok => { configServidorDisponivel = ok || configServidorDisponivel; });
}

// Mescla com os padrões para não quebrar se uma config antiga não tiver campos novos.
/* Cores que já foram padrão em versões anteriores do tema. Se a config
   salva ainda tiver uma delas, é porque o usuário nunca a personalizou —
   então troca pela cor padrão atual. Cores escolhidas de propósito (qualquer
   outro valor) são mantidas. */
const CORES_PADRAO_ANTIGAS = {
  destaque: ['#6750a4', '#000000', '#7a3b2e', '#333333'],
  fundo: ['#fffbfe', '#f6f4ef'],
  texto: ['#1c1b1f', '#20293a', '#000000']
};
function migrarCoresAntigas(cfg) {
  if (!cfg.cores) { cfg.cores = Object.assign({}, CORES_PADRAO); return true; }
  let mudou = false;
  Object.keys(CORES_PADRAO_ANTIGAS).forEach(k => {
    const atual = String(cfg.cores[k] || '').toLowerCase();
    if (!atual || CORES_PADRAO_ANTIGAS[k].includes(atual)) {
      if (cfg.cores[k] !== CORES_PADRAO[k]) { cfg.cores[k] = CORES_PADRAO[k]; mudou = true; }
    }
  });
  // Nome do sistema: mesmo critério das cores — se ainda é um nome padrão
  // antigo (nunca personalizado), troca pelo padrão atual.
  const NOMES_PADRAO_ANTIGOS = ['gerador de contrato', 'gerador de contrato de arrendamento'];
  if (cfg.branding && NOMES_PADRAO_ANTIGOS.includes(String(cfg.branding.nomeSistema || '').trim().toLowerCase())) {
    cfg.branding.nomeSistema = BRANDING_PADRAO.nomeSistema;
    mudou = true;
  }
  return mudou;
}

let CONFIG = Object.assign(ConfigDefaults(), loadConfigLocal() || {});
if (!CONFIG.tiposContrato || !Object.keys(CONFIG.tiposContrato).length) {
  CONFIG.tiposContrato = tiposContratoPadrao();
}
const _coresMigradasLocal = migrarCoresAntigas(CONFIG);

let configServidorDisponivel = false;

/* Busca a config do servidor (se houver backend) e mescla por cima da
   local. Em caso de sucesso, salva a mescla localmente também e chama
   aposCarregar() para a UI se atualizar. Chamado uma vez, na inicialização
   (ui/main.js), de forma assíncrona — a tela já renderiza com a config
   local antes disso, então nada fica bloqueado esperando a rede. */
async function inicializarConfiguracaoServidor(aposCarregar) {
  const doServidor = await carregarConfigServidor();
  configServidorDisponivel = doServidor !== null;
  if (doServidor) {
    CONFIG = Object.assign(ConfigDefaults(), doServidor);
    if (!CONFIG.tiposContrato || !Object.keys(CONFIG.tiposContrato).length) {
      CONFIG.tiposContrato = tiposContratoPadrao();
    }
    migrarCoresAntigas(CONFIG);
    saveConfigLocal(); // também regrava no servidor, já com as cores migradas
    if (typeof aposCarregar === 'function') aposCarregar();
  } else if (_coresMigradasLocal) {
    saveConfigLocal();
  }
  return configServidorDisponivel;
}
