/* =========================================================================
   ARMAZENAMENTO LOCAL — leitura/escrita genérica em localStorage.
   Substitui os pares load/save duplicados que existiam em config.js e
   state.js. Falha de forma silenciosa (retorna padrão) se localStorage
   não estiver disponível ou o conteúdo estiver corrompido.
   ========================================================================= */
function lerLocal(chave, padrao) {
  try {
    const raw = localStorage.getItem(chave);
    return raw ? JSON.parse(raw) : padrao;
  } catch (e) {
    return padrao;
  }
}

function salvarLocal(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch (e) {
    return false;
  }
}
