/* =========================================================================
   MÓDULO: CLIENTES DE API (com fallback entre provedores)
   ========================================================================= */
async function tentarProvedores(lista, montarUrl, montarHeaders, normalizar, categoria){
  for(const prov of lista.filter(p=>p.ativo!==false)){
    const url = montarUrl(prov);
    try{
      const resp = await fetch(url, { headers: montarHeaders(prov) });
      if(!resp.ok){
        console.warn(`[busca ${categoria}] ${prov.nome} respondeu ${resp.status} para ${url}`);
        continue;
      }
      const json = await resp.json();
      const normalizado = normalizar(json, prov);
      if(normalizado) return { ...normalizado, provedor: prov.nome };
      console.warn(`[busca ${categoria}] ${prov.nome} respondeu mas sem os campos esperados:`, json);
    }catch(e){
      console.warn(`[busca ${categoria}] ${prov.nome} falhou (rede/CORS) em ${url}:`, e.message);
      continue;
    }
  }
  return null;
}

function normalizarCep(json){
  if(!json) return null;
  if(json.erro) return null;
  const logradouro = json.logradouro || json.street || json.address || '';
  const bairro = json.bairro || json.neighborhood || json.district || '';
  const cidade = json.localidade || json.city || '';
  const uf = json.uf || json.state || '';
  if(!cidade && !logradouro) return null;
  return { logradouro, bairro, cidade, uf };
}
async function buscarCep(cep){
  cep = apenasDigitos(cep);
  if(cep.length!==8) return null;
  return tentarProvedores(CONFIG.apis.cep,
    p => p.url.replace('{cep}', cep),
    p => p.chave ? { 'X-API-KEY': p.chave } : {},
    normalizarCep, 'CEP');
}

function normalizarCnpj(json){
  if(!json) return null;
  const razao = json.razao_social || json.nome || json.company_name || '';
  if(!razao) return null;
  const logradouro = json.logradouro || (json.endereco && json.endereco.logradouro) || '';
  const numero = json.numero || (json.endereco && json.endereco.numero) || '';
  const bairro = json.bairro || (json.endereco && json.endereco.bairro) || '';
  const cidade = json.municipio || (json.endereco && json.endereco.municipio) || '';
  const uf = json.uf || (json.endereco && json.endereco.uf) || '';
  const cep = json.cep || (json.endereco && json.endereco.cep) || '';
  const qsaRaw = json.qsa || (json.data && json.data.qsa) || [];
  const socios = qsaRaw.map(s => s.nome_socio || s.nome || s.name || '').filter(Boolean);
  return { nomeEmpresa: razao, logradouro, numero, bairro, cidade, uf, cep, socios };
}
async function buscarCnpj(cnpjDigitado){
  const cnpj = apenasDigitos(cnpjDigitado);
  console.info('[busca CNPJ] valor digitado:', cnpjDigitado, '→ enviado às APIs apenas:', cnpj);
  if(cnpj.length!==14){ console.warn('[busca CNPJ] CNPJ com', cnpj.length, 'dígitos (esperado 14) — verifique o valor digitado.'); return null; }
  return tentarProvedores(CONFIG.apis.cnpj,
    p => p.url.replace('{cnpj}', cnpj),
    p => p.chave ? { 'X-API-KEY': p.chave } : {},
    normalizarCnpj, 'CNPJ');
}

function normalizarCpf(json){
  if(!json) return null;
  const nome = json.nome || json.name || (json.data && json.data.nome) || '';
  if(!nome) return null;
  return { nome };
}
async function buscarCpf(cpf){
  cpf = apenasDigitos(cpf);
  if(cpf.length!==11) return null;
  return tentarProvedores(CONFIG.apis.cpf,
    p => p.url.replace('{cpf}', cpf),
    p => p.chave ? { 'X-API-KEY': p.chave } : {},
    normalizarCpf, 'CPF');
}
