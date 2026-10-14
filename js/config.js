/* =========================================================================
   MÓDULO: CONFIG (padrões de fábrica, APIs, cláusulas, branding, fonte, cores)
   ========================================================================= */
const ConfigDefaults = () => ({
  branding: { nomeSistema: 'Gerador de Contrato de Arrendamento', logoDataUrl: '', favicon: '' },
  cores: { destaque: '#333333', fundo: '#F6F4EF', texto: '#000000' },
  fonte: { familia: 'helvetica', tamanho: 10.5 },
  apis: {
    cep: [
      { nome: 'ViaCEP', url: 'https://viacep.com.br/ws/{cep}/json/', chave: '', ativo: true },
      { nome: 'BrasilAPI', url: 'https://brasilapi.com.br/api/cep/v2/{cep}', chave: '', ativo: true },
      { nome: 'AwesomeAPI', url: 'https://cep.awesomeapi.com.br/json/{cep}', chave: '', ativo: true }
    ],
    cnpj: [
      { nome: 'ReceitaWS', url: 'https://receitaws.com.br/v1/cnpj/{cnpj}', chave: '', ativo: true },
      { nome: 'BrasilAPI', url: 'https://minhareceita.org/{cnpj}', chave: '', ativo: true }
    ],
    cpf: [
      { nome: 'ApiCPF', url: 'https://apicpf.com/api/consulta?cpf={cpf}', chave: '', ativo: true }
    ]
  },
  clausulasPadrao: {
    c1: 'O(A) ARRENDANTE é proprietário(a) do(s) seguinte(s) veículo(s), objeto deste contrato:\n{{LISTA_VEICULOS}}',
    c2: 'O(A) ARRENDANTE cede em arrendamento ao(à) ARRENDATÁRIO(A) o(s) veículo(s) descrito(s) na cláusula anterior, para uso exclusivo na execução das atividades do(a) ARRENDATÁRIO(A), incluindo transporte, locomoção e demais serviços correlatos às suas atividades.',
    c3: 'O presente contrato de arrendamento vigora por prazo determinado, com início em {{DATA_INICIO}} e término em {{DATA_FIM}}, data em que se extinguirá automaticamente, independentemente de aviso ou notificação, salvo renovação expressa entre as partes.',
    c4: 'O(A) ARRENDATÁRIO(A) poderá proceder com o(s) veículo(s) ora arrendado(s) ao registro perante a Agência Nacional de Transportes Terrestres (ANTT), não havendo qualquer impedimento por parte do(a) ARRENDANTE, bem como poderá cumprir as exigências legais pertinentes, contratar e subcontratar fretes, receber, pagar e dar quitação de fretes e demais serviços direta ou indiretamente relacionados ao(s) veículo(s) objeto deste instrumento.',
    c5: 'O(A) ARRENDATÁRIO(A) não poderá transferir, ceder ou sublocar a terceiros, a qualquer título, o(s) veículo(s) objeto deste contrato.',
    c6: 'As despesas necessárias para o registro mencionado na Cláusula Quarta ficarão a cargo do(a) ARRENDATÁRIO(A).',
    c7: 'Fica eleito o foro da comarca de {{COMARCA}} como único competente para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.'
  },
  clausulasPersonalizadas: { c1: [], c2: [], c3: [], c4: [], c5: [], c6: [], c7: [] }
});

const CLAUSE_LABELS = { c1: 'CLÁUSULA PRIMEIRA', c2: 'CLÁUSULA SEGUNDA', c3: 'CLÁUSULA TERCEIRA', c4: 'CLÁUSULA QUARTA', c5: 'CLÁUSULA QUINTA', c6: 'CLÁUSULA SEXTA', c7: 'CLÁUSULA SÉTIMA' };

function loadConfigLocal() {
  try { const raw = localStorage.getItem('contrato_config'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function saveConfigLocal() {
  localStorage.setItem('contrato_config', JSON.stringify(CONFIG));
  const el = document.getElementById('msg-config');
  if (el) el.innerHTML = '<div class="msg info">Configurações alteradas. Exporte o config.json para não perder ao trocar de computador.</div>';
}

// Mescla com os padrões para não quebrar se um config.json antigo não tiver campos novos.
let CONFIG = Object.assign(ConfigDefaults(), loadConfigLocal() || {});
