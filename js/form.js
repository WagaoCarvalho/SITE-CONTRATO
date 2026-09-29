/* =========================================================================
   MÓDULO: RENDERIZAÇÃO DO FORMULÁRIO (arrendante/arrendatário)
   ========================================================================= */
function campoPF(prefixo, dados){
  return `
    <div class="grid">
      <div class="field"><label>Nome</label><input type="text" data-bind="${prefixo}.nome" value="${dados.nome||''}"></div>
      <div class="field"><label>CPF</label><div class="row-inline"><input type="text" data-bind="${prefixo}.cpf" data-mask="cpf" placeholder="000.000.000-00" value="${dados.cpf||''}"><button type="button" class="btn secondary small" data-buscar="cpf" data-prefixo="${prefixo}" title="Buscar dados pelo CPF">→</button></div></div>
      <div class="field"><label>Nacionalidade</label><input type="text" data-bind="${prefixo}.nacionalidade" value="${dados.nacionalidade||''}"></div>
      <div class="field"><label>Profissão</label><input type="text" data-bind="${prefixo}.profissao" value="${dados.profissao||''}"></div>
    </div>
    <div class="grid" style="margin-top:10px;">
      <div class="field"><label>CEP</label><div class="row-inline"><input type="text" data-bind="${prefixo}.cep" data-mask="cep" placeholder="00000-000" value="${dados.cep||''}"><button type="button" class="btn secondary small" data-buscar="cep" data-prefixo="${prefixo}" title="Buscar endereço pelo CEP">→</button></div></div>
      <div class="field"><label>Logradouro</label><input type="text" data-bind="${prefixo}.logradouro" value="${dados.logradouro||''}"></div>
      <div class="field"><label>Número/Compl.</label><input type="text" data-bind="${prefixo}.numero" value="${dados.numero||''}"></div>
      <div class="field"><label>Bairro</label><input type="text" data-bind="${prefixo}.bairro" value="${dados.bairro||''}"></div>
      <div class="field"><label>Cidade</label><input type="text" data-bind="${prefixo}.cidade" value="${dados.cidade||''}"></div>
      <div class="field"><label>UF</label><input type="text" data-bind="${prefixo}.uf" value="${dados.uf||''}"></div>
    </div>`;
}
function campoPJ(prefixo, dados){
  const socioOptions = (dados.socios||[]).map(s=>`<option ${s===dados.socioSelecionado?'selected':''}>${s}</option>`).join('');
  return `
    <div class="grid">
      <div class="field"><label>CNPJ</label><div class="row-inline"><input type="text" data-bind="${prefixo}.cnpj" data-mask="cnpj" placeholder="00.000.000/0000-00" value="${dados.cnpj||''}"><button type="button" class="btn secondary small" data-buscar="cnpj" data-prefixo="${prefixo}" title="Buscar dados pelo CNPJ">→</button></div></div>
      <div class="field"><label>Nome da empresa</label><input type="text" data-bind="${prefixo}.nomeEmpresa" value="${dados.nomeEmpresa||''}"></div>
    </div>
    <div class="grid" style="margin-top:10px;">
      <div class="field"><label>CEP</label><div class="row-inline"><input type="text" data-bind="${prefixo}.cep" data-mask="cep" placeholder="00000-000" value="${dados.cep||''}"><button type="button" class="btn secondary small" data-buscar="cep" data-prefixo="${prefixo}" title="Buscar endereço pelo CEP">→</button></div></div>
      <div class="field"><label>Logradouro</label><input type="text" data-bind="${prefixo}.logradouro" value="${dados.logradouro||''}"></div>
      <div class="field"><label>Número/Compl.</label><input type="text" data-bind="${prefixo}.numero" value="${dados.numero||''}"></div>
      <div class="field"><label>Bairro</label><input type="text" data-bind="${prefixo}.bairro" value="${dados.bairro||''}"></div>
      <div class="field"><label>Cidade</label><input type="text" data-bind="${prefixo}.cidade" value="${dados.cidade||''}"></div>
      <div class="field"><label>UF</label><input type="text" data-bind="${prefixo}.uf" value="${dados.uf||''}"></div>
    </div>
    <div class="field" style="margin-top:10px;max-width:320px;">
      <label>Sócio que vai assinar</label>
      <select data-bind="${prefixo}.socioSelecionado" data-select-socio="${prefixo}">
        <option value="">Digitar manualmente...</option>
        ${socioOptions}
      </select>
      <input type="text" style="margin-top:6px;display:${dados.socios&&dados.socios.length?'none':'block'};" data-bind="${prefixo}.socioSelecionado" data-manual-socio="${prefixo}" placeholder="Nome do sócio" value="${(!dados.socios||!dados.socios.length)?(dados.socioSelecionado||''):''}">
    </div>`;
}
function renderParte(prefixo){
  const tipo = prefixo==='arrendante' ? STATE.tipoArrendante : STATE.tipoArrendatario;
  const dados = STATE[prefixo];
  const container = document.getElementById('form-'+prefixo);
  container.innerHTML = tipo==='PF' ? campoPF(prefixo, dados) : campoPJ(prefixo, dados);
}

function getByPath(obj, path){ return path.split('.').reduce((o,k)=>o&&o[k], obj); }
function setByPath(obj, path, val){ const parts=path.split('.'); let o=obj; for(let i=0;i<parts.length-1;i++) o=o[parts[i]]; o[parts[parts.length-1]]=val; }

/* =========================================================================
   NOVO: Helpers de maiusculização
   ========================================================================= */

// Campos que NÃO devem ser maiusculizados (são numéricos, datas ou select)
const CAMPOS_SEM_MAIUSCULO = new Set([
  'cpf', 'cnpj', 'cep',            // máscaras — só dígitos e pontuação
  'dataAtual', 'prazoInicio', 'prazoFim', // datas
  'tipoFirma'                       // vem de <select>
]);

// Retorna true se o campo (último segmento do data-bind) deve virar maiúsculo
function deveMaiusculizar(bind){
  if(!bind) return false;
  // Pega só o último segmento: "arrendante.nome" → "nome"
  const campo = bind.split('.').pop();
  return !CAMPOS_SEM_MAIUSCULO.has(campo);
}

// Aplica .toUpperCase() em todas as strings de um objeto raso
// (usado nos retornos de CEP/CNPJ/CPF)
function maiusculizarStrings(obj){
  const out = {};
  for(const k in obj){
    const v = obj[k];
    out[k] = (typeof v === 'string') ? v.toUpperCase() : v;
  }
  return out;
}

/* =========================================================================
   Listener global de input — aplica máscara E maiusculização em tempo real
   ========================================================================= */
document.addEventListener('input', e=>{
  const mascara = e.target.getAttribute('data-mask');
  if(mascara){
    e.target.value = aplicarMascara(e.target.value, mascara);
  } else {
    // Opção B: o próprio input mostra maiúsculo em tempo real.
    // Só aplica se o campo é texto (não é date, number, etc.) e não está no ignore.
    const bind = e.target.getAttribute('data-bind');
    const ehTexto = !e.target.type || e.target.type === 'text' || e.target.tagName === 'TEXTAREA';
    if(ehTexto && deveMaiusculizar(bind)){
      e.target.value = e.target.value.toUpperCase();
    }
  }

  const bind = e.target.getAttribute('data-bind');
  if(bind){
    // Garante que o STATE receba também o valor maiúsculo (o DOM já está)
    const valorFinal = (mascara || deveMaiusculizar(bind) && (e.target.type === 'text' || !e.target.type))
      ? e.target.value
      : e.target.value;
    setByPath(STATE, bind, valorFinal);
    saveDraftLocal();
    atualizarValidacao();
  }
});

/* =========================================================================
   Busca em APIs — maiusculiza tudo que vier do servidor
   ========================================================================= */
async function executarBusca(tipo, prefixo){
  const btn = document.querySelector(`[data-buscar="${tipo}"][data-prefixo="${prefixo}"]`);
  const campo = tipo==='cep' ? 'cep' : tipo;
  const input = document.querySelector(`[data-bind="${prefixo}.${campo}"]`);
  const valor = input ? input.value : '';
  if(btn){ btn.disabled = true; btn.textContent = '...'; }
  try{
    if(tipo==='cep'){
      const r = await buscarCep(valor);
      if(r){
        const up = maiusculizarStrings({
          logradouro: r.logradouro, bairro: r.bairro, cidade: r.cidade, uf: r.uf
        });
        Object.assign(STATE[prefixo], up);
        renderParte(prefixo); saveDraftLocal(); atualizarValidacao();
      }
      else alert('CEP não encontrado em nenhuma das APIs configuradas.');
    } else if(tipo==='cnpj'){
      const r = await buscarCnpj(valor);
      if(r){
        // Preserva fallbacks existentes e maiusculiza só strings
        const up = maiusculizarStrings({
          nomeEmpresa: r.nomeEmpresa || STATE[prefixo].nomeEmpresa,
          logradouro:  r.logradouro  || STATE[prefixo].logradouro,
          numero:      r.numero      || STATE[prefixo].numero,
          bairro:      r.bairro      || STATE[prefixo].bairro,
          cidade:      r.cidade      || STATE[prefixo].cidade,
          uf:          r.uf          || STATE[prefixo].uf
        });
        Object.assign(STATE[prefixo], up, {
          cep: r.cep ? aplicarMascara(r.cep, 'cep') : STATE[prefixo].cep,
          socios: (r.socios||[]).map(s => s.toUpperCase()),
          socioSelecionado: (r.socios && r.socios[0]) ? r.socios[0].toUpperCase() : ''
        });
        renderParte(prefixo); saveDraftLocal(); atualizarValidacao();
      }
      else alert('CNPJ não encontrado em nenhuma das APIs configuradas.');
    } else if(tipo==='cpf'){
      const r = await buscarCpf(valor);
      if(r){
        STATE[prefixo].nome = (r.nome || '').toUpperCase();
        renderParte(prefixo); saveDraftLocal(); atualizarValidacao();
      }
      else alert('CPF não encontrado em nenhuma das APIs configuradas (verifique se a chave está configurada em Configurações).');
    }
  } finally {
    if(btn){ btn.disabled = false; btn.textContent = '→'; }
  }
}
document.addEventListener('click', e=>{
  const tipo = e.target.getAttribute('data-buscar');
  if(tipo){ executarBusca(tipo, e.target.getAttribute('data-prefixo')); }
});

document.getElementById('toggle-arrendante').addEventListener('click', e=>{
  if(e.target.tagName!=='BUTTON') return;
  STATE.tipoArrendante = e.target.getAttribute('data-val');
  [...e.currentTarget.children].forEach(b=>b.classList.toggle('active', b===e.target));
  renderParte('arrendante'); saveDraftLocal(); atualizarValidacao();
});
document.getElementById('toggle-arrendatario').addEventListener('click', e=>{
  if(e.target.tagName!=='BUTTON') return;
  STATE.tipoArrendatario = e.target.getAttribute('data-val');
  [...e.currentTarget.children].forEach(b=>b.classList.toggle('active', b===e.target));
  renderParte('arrendatario'); saveDraftLocal(); atualizarValidacao();
});

/* =========================================================================
   MÓDULO: VEÍCULOS
   ========================================================================= */
function renderVeiculos(){
  const tbody = document.querySelector('#tabela-veiculos tbody');
  tbody.innerHTML = STATE.veiculos.map((v,i)=>`
    <tr>
      <td>${v.placa}</td><td>${v.marca}</td><td>${v.ano}</td><td>${v.chassis}</td>
      <td><button class="btn danger small" data-remove-veiculo="${i}">Excluir</button></td>
    </tr>`).join('');
}
document.getElementById('btn-add-veiculo').addEventListener('click', ()=>{
  // Maiusculiza placa, marca e chassis. Ano é numérico, deixa como está.
  const placa   = document.getElementById('v-placa').value.trim().toUpperCase();
  const marca   = document.getElementById('v-marca').value.trim().toUpperCase();
  const ano     = document.getElementById('v-ano').value.trim(); // numérico
  const chassis = document.getElementById('v-chassis').value.trim().toUpperCase();
  if(!placa || !marca){ alert('Preencha ao menos Placa e Marca/Modelo do veículo.'); return; }
  STATE.veiculos.push({placa, marca, ano, chassis});
  ['v-placa','v-marca','v-ano','v-chassis'].forEach(id=>document.getElementById(id).value='');
  renderVeiculos(); saveDraftLocal(); atualizarValidacao();
});
document.querySelector('#tabela-veiculos tbody').addEventListener('click', e=>{
  const idx = e.target.getAttribute('data-remove-veiculo');
  if(idx===null) return;
  STATE.veiculos.splice(Number(idx),1);
  renderVeiculos(); saveDraftLocal(); atualizarValidacao();
});

/* =========================================================================
   MÓDULO: DATAS / COMARCA / FIRMA
   ========================================================================= */
function bindCamposSimples(){
  const map = { 'f-data-atual':'dataAtual', 'f-prazo-inicio':'prazoInicio', 'f-prazo-fim':'prazoFim', 'f-comarca':'comarca', 'f-tipo-firma':'tipoFirma' };
  Object.entries(map).forEach(([id,key])=>{
    const el = document.getElementById(id);
    el.value = STATE[key];
    el.addEventListener('input', ()=>{
      let v = el.value;
      // Comarca vira maiúscula. Datas e tipoFirma (<select>) ficam como estão.
      if(key === 'comarca'){
        v = v.toUpperCase();
        el.value = v;
      }
      STATE[key] = v;
      saveDraftLocal();
      atualizarValidacao();
    });
  });
  document.getElementById('f-prazo-inicio').addEventListener('change', ()=>{
    const d = new Date(STATE.prazoInicio); d.setFullYear(d.getFullYear()+5);
    STATE.prazoFim = d.toISOString().slice(0,10);
    document.getElementById('f-prazo-fim').value = STATE.prazoFim;
    saveDraftLocal();
  });
}

/* =========================================================================
   MÓDULO: VALIDAÇÃO
   ========================================================================= */
function validarFormulario(){
  const faltando = [];
  function checarParte(prefixo, label){
    const tipo = prefixo==='arrendante'?STATE.tipoArrendante:STATE.tipoArrendatario;
    const d = STATE[prefixo];
    if(tipo==='PF'){
      if(!d.nome) faltando.push(`Nome do(a) ${label}`);
      if(!d.cpf) faltando.push(`CPF do(a) ${label}`);
    } else {
      if(!d.cnpj) faltando.push(`CNPJ do(a) ${label}`);
      if(!d.nomeEmpresa) faltando.push(`Nome da empresa (${label})`);
      if(!d.socioSelecionado) faltando.push(`Sócio assinante (${label})`);
    }
    if(!d.cep) faltando.push(`CEP do(a) ${label}`);
    if(!d.logradouro) faltando.push(`Logradouro do(a) ${label}`);
    if(!d.cidade) faltando.push(`Cidade do(a) ${label}`);
    if(!d.uf) faltando.push(`UF do(a) ${label}`);
  }
  checarParte('arrendante','Arrendante');
  checarParte('arrendatario','Arrendatário');
  if(!STATE.dataAtual) faltando.push('Data atual');
  if(!STATE.prazoInicio) faltando.push('Início do prazo');
  if(!STATE.prazoFim) faltando.push('Fim do prazo');
  if(!STATE.comarca) faltando.push('Comarca');
  if(!STATE.veiculos.length) faltando.push('Ao menos 1 veículo');
  return faltando;
}
function atualizarValidacao(){
  const faltando = validarFormulario();
  const msgEl = document.getElementById('msg-validacao');
  const btn = document.getElementById('btn-gerar-pdf');
  if(faltando.length){
    msgEl.innerHTML = `<div class="msg err">Faltam preencher: ${faltando.join(', ')}.</div>`;
    btn.disabled = true;
  } else {
    msgEl.innerHTML = '';
    btn.disabled = false;
  }
}