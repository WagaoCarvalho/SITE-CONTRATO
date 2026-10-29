/* =========================================================================
   CONSTANTES — valores fixos usados em mais de um módulo.
   Nada aqui tem efeito colateral (sem DOM, sem fetch, sem localStorage).
   ========================================================================= */

const CHAVES_LOCALSTORAGE = {
  CONFIG: 'contrato_config',
  RASCUNHO: 'contrato_rascunho'
};

const ENDPOINT_CONFIG_SERVIDOR = '/api/config';

const LAYOUT_PDF = {
  MARGEM_MM: 15,
  PAGINA_LARGURA_MM: 210,
  PAGINA_ALTURA_MM: 297,
  ALTURA_BOX_ASSINATURA_MM: 26,
  ALTURA_RESERVADA_BLOCO_FINAL_MM: 70,
  ENTRELINHA_FATOR: 1.3 // entrelinha ~1.3x o tamanho da fonte (compacto, como no modelo)
};

const FONTE_PDF_PADRAO = { familia: 'helvetica', tamanho: 10.5 };

const CORES_PADRAO = { destaque: '#111111', fundo: '#F5F5F5', texto: '#111111' };

const BRANDING_PADRAO = { nomeSistema: 'Gerador de Contrato', logoDataUrl: '', favicon: '📄' };

/* Ordinais em português para rotular cláusulas dinamicamente, independente
   de quantas cláusulas cada tipo de contrato tenha (SRP/OCP: nenhum tipo
   de contrato fica limitado a um número fixo de cláusulas). */
const ORDINAIS_CLAUSULA = [
  'PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÉTIMA', 'OITAVA', 'NONA', 'DÉCIMA',
  'DÉCIMA PRIMEIRA', 'DÉCIMA SEGUNDA', 'DÉCIMA TERCEIRA', 'DÉCIMA QUARTA', 'DÉCIMA QUINTA',
  'DÉCIMA SEXTA', 'DÉCIMA SÉTIMA', 'DÉCIMA OITAVA', 'DÉCIMA NONA', 'VIGÉSIMA'
];

/* indice: posição da cláusula começando em 0 */
function rotuloClausula(indice) {
  const ordinal = ORDINAIS_CLAUSULA[indice] || `Nº ${indice + 1}`;
  return `CLÁUSULA ${ordinal}`;
}
