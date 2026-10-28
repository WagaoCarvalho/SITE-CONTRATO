/* =========================================================================
   TIPOS DE PARTE (PF / PJ) — fonte única de verdade.
   Antes esta regra estava duplicada em 4 lugares (campos do formulário,
   validação, qualificação em texto e qualificação em segmentos do PDF).
   Qualquer campo novo, ou um 3º tipo de parte no futuro, só muda aqui.
   ========================================================================= */

function qualificacaoPF(d, papel) {
  return `${d.nome}, nacionalidade ${d.nacionalidade || 'BRASILEIRA'}, profissão ${d.profissao || 'AUTÔNOMO(A)'}, `
    + `portador(a) do CPF nº ${formatCPF(d.cpf)}, residente e domiciliado(a) à ${d.logradouro}, nº ${d.numero || 'S/N'}, `
    + `Bairro ${d.bairro}, CEP ${formatCEP(d.cep)}, na cidade de ${d.cidade}/${d.uf}, doravante denominado(a) ${papel}`;
}
function qualificacaoSegmentosPF(d, papel) {
  return [
    dyn(d.nome), seg(', nacionalidade '), dyn(d.nacionalidade || 'BRASILEIRA'), seg(', profissão '), dyn(d.profissao || 'AUTÔNOMO(A)'),
    seg(', portador(a) do CPF nº '), dyn(formatCPF(d.cpf)), seg(', residente e domiciliado(a) à '), dyn(d.logradouro),
    seg(', nº '), dyn(d.numero || 'S/N'), seg(', Bairro '), dyn(d.bairro), seg(', CEP '), dyn(formatCEP(d.cep)),
    seg(', na cidade de '), dyn(d.cidade + '/' + d.uf), seg(', doravante denominado(a) ' + papel)
  ];
}
function qualificacaoPJ(d, papel) {
  return `${d.nomeEmpresa}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${formatCNPJ(d.cnpj)}, `
    + `com sede à ${d.logradouro}, nº ${d.numero || 'S/N'}, Bairro ${d.bairro}, CEP ${formatCEP(d.cep)}, `
    + `na cidade de ${d.cidade}/${d.uf}, neste ato representada por seu sócio ${d.socioSelecionado}, doravante denominada ${papel}`;
}
function qualificacaoSegmentosPJ(d, papel) {
  return [
    dyn(d.nomeEmpresa), seg(', pessoa jurídica de direito privado, inscrita no CNPJ sob nº '), dyn(formatCNPJ(d.cnpj)),
    seg(', com sede à '), dyn(d.logradouro), seg(', nº '), dyn(d.numero || 'S/N'), seg(', Bairro '), dyn(d.bairro),
    seg(', CEP '), dyn(formatCEP(d.cep)), seg(', na cidade de '), dyn(d.cidade + '/' + d.uf),
    seg(', neste ato representada por seu sócio '), dyn(d.socioSelecionado), seg(', doravante denominada ' + papel)
  ];
}

const TIPOS_PARTE = {
  PF: {
    rotulo: 'Pessoa Física',
    dadosIniciais: () => ({ nome: '', cpf: '', nacionalidade: 'BRASILEIRO', profissao: 'AUTÔNOMO', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' }),
    // Campos exibidos no formulário, nesta ordem. "busca" liga um botão de API (ver infra/api-client.js).
    campos: [
      { campo: 'nome', label: 'Nome' },
      { campo: 'cpf', label: 'CPF', mascara: 'cpf', busca: 'cpf', placeholder: '000.000.000-00' },
      { campo: 'nacionalidade', label: 'Nacionalidade' },
      { campo: 'profissao', label: 'Profissão' },
      { campo: 'cep', label: 'CEP', mascara: 'cep', busca: 'cep', placeholder: '00000-000' },
      { campo: 'logradouro', label: 'Logradouro' },
      { campo: 'numero', label: 'Número/Compl.' },
      { campo: 'bairro', label: 'Bairro' },
      { campo: 'cidade', label: 'Cidade' },
      { campo: 'uf', label: 'UF' }
    ],
    obrigatorios: ['nome', 'cpf', 'cep', 'logradouro', 'cidade', 'uf'],
    temSocio: false,
    qualificar: qualificacaoPF,
    qualificarSegmentos: qualificacaoSegmentosPF
  },
  PJ: {
    rotulo: 'Empresa',
    dadosIniciais: () => ({ cnpj: '', nomeEmpresa: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '', socios: [], socioSelecionado: '' }),
    campos: [
      { campo: 'cnpj', label: 'CNPJ', mascara: 'cnpj', busca: 'cnpj', placeholder: '00.000.000/0000-00' },
      { campo: 'nomeEmpresa', label: 'Nome da empresa' },
      { campo: 'cep', label: 'CEP', mascara: 'cep', busca: 'cep', placeholder: '00000-000' },
      { campo: 'logradouro', label: 'Logradouro' },
      { campo: 'numero', label: 'Número/Compl.' },
      { campo: 'bairro', label: 'Bairro' },
      { campo: 'cidade', label: 'Cidade' },
      { campo: 'uf', label: 'UF' }
    ],
    obrigatorios: ['cnpj', 'nomeEmpresa', 'cep', 'logradouro', 'cidade', 'uf'],
    temSocio: true,
    qualificar: qualificacaoPJ,
    qualificarSegmentos: qualificacaoSegmentosPJ
  }
};

function dadosIniciaisParte(tipo) {
  // PF e PJ não compartilham campos, mas o estado guarda os dois conjuntos juntos
  // (assim trocar o toggle não perde o que já foi digitado do outro tipo).
  return Object.assign(TIPOS_PARTE.PF.dadosIniciais(), TIPOS_PARTE.PJ.dadosIniciais());
}
