/* =========================================================================
   ARMAZENAMENTO NO SERVIDOR — persistência de CONFIG (incluindo chaves de
   API e tipos de contrato/cláusulas) via backend Go (server/main.go).
   Degrada graciosamente: se o servidor não responder (ex.: página aberta
   como file:// ou backend fora do ar), as funções abaixo retornam
   null/false e o chamador continua usando apenas o localStorage.
   ========================================================================= */
async function carregarConfigServidor() {
  try {
    const resp = await fetch(ENDPOINT_CONFIG_SERVIDOR, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return null;
    const dados = await resp.json();
    return dados && typeof dados === 'object' ? dados : null;
  } catch (e) {
    return null;
  }
}

async function salvarConfigServidor(config) {
  try {
    const resp = await fetch(ENDPOINT_CONFIG_SERVIDOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return resp.ok;
  } catch (e) {
    return false;
  }
}

async function servidorDisponivel() {
  try {
    const resp = await fetch(ENDPOINT_CONFIG_SERVIDOR, { method: 'GET' });
    return resp.ok || resp.status === 204;
  } catch (e) {
    return false;
  }
}
