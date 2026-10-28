/* =========================================================================
   MÓDULO: FORMATADORES E MÁSCARAS
   ========================================================================= */
function apenasDigitos(v){ return (v||'').replace(/\D/g,''); }
function formatCPF(v){ v=apenasDigitos(v); return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4'); }
function formatCNPJ(v){ v=apenasDigitos(v); return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'); }
function formatCEP(v){ v=apenasDigitos(v); return v.replace(/(\d{5})(\d{3})/,'$1-$2'); }
function dataExtenso(iso){
  if(!iso) return '';
  const meses=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const [y,m,d]=iso.split('-').map(Number);
  return `${d} de ${meses[m-1]} de ${y}`;
}
function dataBR(iso){ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }

function aplicarMascara(valor, tipo){
  let d = apenasDigitos(valor);
  if(tipo==='cpf'){
    d = d.slice(0,11);
    return d.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/, (m,a,b,c,e)=> a + (b?'.'+b:'') + (c?'.'+c:'') + (e?'-'+e:''));
  }
  if(tipo==='cnpj'){
    d = d.slice(0,14);
    return d.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/, (m,a,b,c,e,f)=> a + (b?'.'+b:'') + (c?'.'+c:'') + (e?'/'+e:'') + (f?'-'+f:''));
  }
  if(tipo==='cep'){
    d = d.slice(0,8);
    return d.replace(/^(\d{0,5})(\d{0,3})$/, (m,a,b)=> a + (b?'-'+b:''));
  }
  if(tipo==='placa'){
    return valor.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7);
  }
  if(tipo==='ano'){
    return apenasDigitos(valor).slice(0,4);
  }
  return valor;
}
