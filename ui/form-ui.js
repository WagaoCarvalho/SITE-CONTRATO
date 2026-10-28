/* =========================================================================
   UI: FORMULÁRIO (arrendante/arrendatário, tipo de contrato, veículos).
   Renderização genérica por tipo de parte (TIPOS_PARTE) — sem duplicar
   template para PF/PJ.
   ========================================================================= */
function campoGenerico(prefixo, tipo, dados, campoDef) {
  const valor = dados[campoDef.campo] || '';
  const bind = `${prefixo}.${campoDef.campo}`;
  const maskAttr = campoDef.mascara ? ` data-mask="${campoDef.mascara}"` : '';
  const placeholderAttr = campoDef.placeholder ? ` placeholder="${campoDef.placeholder}"` : '';
  const input = `<input type="text" data-bind="${bind}"${maskAttr}${placeholderAttr} value="${valor}">`;
  if (campoDef.busca) {
    return `<div class="field"><label>${campoDef.label}</label><div class="row-inline">${input}<button type="button" class="btn secondary small" data-buscar="${campoDef.busca}" data-prefixo="${prefixo}" title="Buscar dados">→</button></div></div>`;
  }
  return `<div class="field"><label>${campoDef.label}</label>${input}</div>`;
}

function campoSocioPJ(prefixo, dados) {
  const socioOptions = (dados.socios || []).map(s => `<option ${s === dados.socioSelecionado ? 'selected' : ''}>${s}</option>`).join('');
  return `<div class="field" style="margin-top:10px;max-width:320px;">
      <label>Sócio ou titular (MEI) que vai assinar</label>
      <select data-bind="${prefixo}.socioSelecionado" data-select-socio="${prefixo}">
        <option value="">Digitar manualmente...</option>
        ${socioOptions}
      </select>
      <input type="text" style="margin-top:6px;display:${dados.socios && dados.socios.length ? 'none' : 'block'};" data-bind="${prefixo}.socioSelecionado" data-manual-socio="${prefixo}" placeholder="Nome da pessoa física que vai assinar (sócio ou titular do MEI)" value="${(!dados.socios || !dados.socios.length) ? (dados.socioSelecionado || '') : ''}">
    </div>`;
}

function renderParte(prefixo) {
  const tipo = prefixo === 'arrendante' ? STATE.tipoArrendante : STATE.tipoArrendatario;
  const dados = STATE[prefixo];
  const def = TIPOS_PARTE[tipo];
  const container = document.getElementById('form-' + prefixo);
  const campos = def.campos.map(c => campoGenerico(prefixo, tipo, dados, c)).join('');
  container.innerHTML = `<div class="grid">${campos}</div>` + (def.temSocio ? campoSocioPJ(prefixo, dados) : '');
}

function getByPath(obj, path) { return path.split('.').reduce((o, k) => o && o[k], obj); }
function setByPath(obj, path, val) { const parts = path.split('.'); let o = obj; for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]]; o[parts[parts.length - 1]] = val; }

const CAMPOS_SEM_MAIUSCULO = new Set(['cpf', 'cnpj', 'cep', 'dataAtual', 'prazoInicio', 'prazoFim', 'tipoFirma']);
function deveMaiusculizar(bind) {
  if (!bind) return false;
  return !CAMPOS_SEM_MAIUSCULO.has(bind.split('.').pop());
}
function maiusculizarStrings(obj) {
  const out = {};
  for (const k in obj) { const v = obj[k]; out[k] = (typeof v === 'string') ? v.toUpperCase() : v; }
  return out;
}

document.addEventListener('input', e => {
  const mascara = e.target.getAttribute('data-mask');
  if (mascara) {
    e.target.value = aplicarMascara(e.target.value, mascara);
  } else {
    const bind = e.target.getAttribute('data-bind');
    const ehTexto = !e.target.type || e.target.type === 'text' || e.target.tagName === 'TEXTAREA';
    if (ehTexto && deveMaiusculizar(bind)) e.target.value = e.target.value.toUpperCase();
  }

  const bind = e.target.getAttribute('data-bind');
  if (bind) {
    setByPath(STATE, bind, e.target.value);
    saveDraftLocal();
    atualizarValidacaoUI();
  }
});

async function executarBusca(tipo, prefixo) {
  const btn = document.querySelector(`[data-buscar="${tipo}"][data-prefixo="${prefixo}"]`);
  const campo = tipo === 'cep' ? 'cep' : tipo;
  const input = document.querySelector(`[data-bind="${prefixo}.${campo}"]`);
  const valor = input ? input.value : '';
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  try {
    if (tipo === 'cep') {
      const r = await buscarCep(valor);
      if (r) {
        Object.assign(STATE[prefixo], maiusculizarStrings({ logradouro: r.logradouro, bairro: r.bairro, cidade: r.cidade, uf: r.uf }));
        renderParte(prefixo); saveDraftLocal(); atualizarValidacaoUI();
      } else alert('CEP não encontrado em nenhuma das APIs configuradas.');
    } else if (tipo === 'cnpj') {
      const r = await buscarCnpj(valor);
      if (r) {
        const up = maiusculizarStrings({
          nomeEmpresa: r.nomeEmpresa || STATE[prefixo].nomeEmpresa,
          logradouro: r.logradouro || STATE[prefixo].logradouro,
          numero: r.numero || STATE[prefixo].numero,
          bairro: r.bairro || STATE[prefixo].bairro,
          cidade: r.cidade || STATE[prefixo].cidade,
          uf: r.uf || STATE[prefixo].uf
        });
        Object.assign(STATE[prefixo], up, {
          cep: r.cep ? aplicarMascara(r.cep, 'cep') : STATE[prefixo].cep,
          socios: (r.socios || []).map(s => s.toUpperCase()),
          socioSelecionado: (r.socios && r.socios[0]) ? r.socios[0].toUpperCase() : ''
        });
        renderParte(prefixo); saveDraftLocal(); atualizarValidacaoUI();
      } else alert('CNPJ não encontrado em nenhuma das APIs configuradas.');
    } else if (tipo === 'cpf') {
      const r = await buscarCpf(valor);
      if (r) {
        STATE[prefixo].nome = (r.nome || '').toUpperCase();
        renderParte(prefixo); saveDraftLocal(); atualizarValidacaoUI();
      } else alert('CPF não encontrado em nenhuma das APIs configuradas (verifique se a chave está configurada em Configurações).');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '→'; }
  }
}
document.addEventListener('click', e => {
  const tipo = e.target.getAttribute('data-buscar');
  if (tipo) executarBusca(tipo, e.target.getAttribute('data-prefixo'));
});

/* Sincroniza o botão PF/PJ "ativo" com o STATE real — sem isso, ao
   carregar um rascunho salvo com tipo diferente do marcado por padrão no
   HTML, o botão ficava mostrando um tipo enquanto o formulário renderizava
   outro, até o usuário clicar em algum dos dois (bug relatado: às vezes o
   formulário aparecia como CPF com o botão CNPJ marcado). */
function renderTogglesParte() {
  ['arrendante', 'arrendatario'].forEach(prefixo => {
    const tipo = prefixo === 'arrendante' ? STATE.tipoArrendante : STATE.tipoArrendatario;
    const grupo = document.getElementById('toggle-' + prefixo);
    [...grupo.children].forEach(b => b.classList.toggle('active', b.getAttribute('data-val') === tipo));
  });
}

document.getElementById('toggle-arrendante').addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  STATE.tipoArrendante = e.target.getAttribute('data-val');
  [...e.currentTarget.children].forEach(b => b.classList.toggle('active', b === e.target));
  renderParte('arrendante'); saveDraftLocal(); atualizarValidacaoUI();
});
document.getElementById('toggle-arrendatario').addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  STATE.tipoArrendatario = e.target.getAttribute('data-val');
  [...e.currentTarget.children].forEach(b => b.classList.toggle('active', b === e.target));
  renderParte('arrendatario'); saveDraftLocal(); atualizarValidacaoUI();
});

/* ---- Tipo de contrato (Arrendamento / Comodato / cadastrados) ---- */
function renderSeletorTipoContrato() {
  const sel = document.getElementById('f-tipo-contrato');
  if (!sel) return;
  sel.innerHTML = Object.keys(CONFIG.tiposContrato).map(chave =>
    `<option value="${chave}" ${chave === STATE.tipoContrato ? 'selected' : ''}>${CONFIG.tiposContrato[chave].nome}</option>`
  ).join('');
}
document.getElementById('f-tipo-contrato').addEventListener('change', e => {
  STATE.tipoContrato = e.target.value;
  garantirEstruturaClausulas(STATE, CONFIG);
  saveDraftLocal();
  if (typeof renderClausulas === 'function') renderClausulas();
});

/* =========================================================================
   VEÍCULOS
   ========================================================================= */
function renderVeiculos() {
  const tbody = document.querySelector('#tabela-veiculos tbody');
  tbody.innerHTML = STATE.veiculos.map((v, i) => `
    <tr>
      <td>${v.placa}</td><td>${v.marca}</td><td>${v.ano}</td><td>${v.chassis}</td>
      <td><button class="btn danger small" data-remove-veiculo="${i}">Excluir</button></td>
    </tr>`).join('');
}
document.getElementById('btn-add-veiculo').addEventListener('click', () => {
  const placa = document.getElementById('v-placa').value.trim().toUpperCase();
  const marca = document.getElementById('v-marca').value.trim().toUpperCase();
  const ano = document.getElementById('v-ano').value.trim();
  const chassis = document.getElementById('v-chassis').value.trim().toUpperCase();
  if (!placa || !marca) { alert('Preencha ao menos Placa e Marca/Modelo do veículo.'); return; }
  STATE.veiculos.push({ placa, marca, ano, chassis });
  ['v-placa', 'v-marca', 'v-ano', 'v-chassis'].forEach(id => document.getElementById(id).value = '');
  renderVeiculos(); saveDraftLocal(); atualizarValidacaoUI();
});
document.querySelector('#tabela-veiculos tbody').addEventListener('click', e => {
  const idx = e.target.getAttribute('data-remove-veiculo');
  if (idx === null) return;
  STATE.veiculos.splice(Number(idx), 1);
  renderVeiculos(); saveDraftLocal(); atualizarValidacaoUI();
});

/* =========================================================================
   DATAS / COMARCA / FIRMA
   ========================================================================= */
function bindCamposSimples() {
  const map = { 'f-data-atual': 'dataAtual', 'f-prazo-inicio': 'prazoInicio', 'f-prazo-fim': 'prazoFim', 'f-comarca': 'comarca', 'f-tipo-firma': 'tipoFirma' };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    el.value = STATE[key];
    el.addEventListener('input', () => {
      let v = el.value;
      if (key === 'comarca') { v = v.toUpperCase(); el.value = v; }
      STATE[key] = v;
      saveDraftLocal();
      atualizarValidacaoUI();
    });
  });
  document.getElementById('f-prazo-inicio').addEventListener('change', () => {
    const d = new Date(STATE.prazoInicio); d.setFullYear(d.getFullYear() + 5);
    STATE.prazoFim = d.toISOString().slice(0, 10);
    document.getElementById('f-prazo-fim').value = STATE.prazoFim;
    saveDraftLocal();
  });
}

/* =========================================================================
   VALIDAÇÃO NA TELA (lógica pura em core/validacao.js)
   ========================================================================= */
function atualizarValidacaoUI() {
  const faltando = validarFormulario(STATE);
  const msgEl = document.getElementById('msg-validacao');
  const btn = document.getElementById('btn-gerar-pdf');
  if (faltando.length) {
    msgEl.innerHTML = `<div class="msg err">Faltam preencher: ${faltando.join(', ')}.</div>`;
    btn.disabled = true;
  } else {
    msgEl.innerHTML = '';
    btn.disabled = false;
  }
}
