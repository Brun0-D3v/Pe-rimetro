import { CHAVE_SESSAO } from "../config/authConfig";

function instante(valor) {
  const tempo = new Date(valor).getTime();
  return Number.isNaN(tempo) ? null : tempo;
}

export function limparSessao() {
  try {
    localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // localStorage indisponível: a sessão só dura enquanto a página estiver aberta
  }
}

export function salvarSessao(sessao) {
  try {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  } catch {
    // localStorage indisponível (ex.: navegação privada)
  }
}

/** Lê a sessão salva; descarta (e apaga) o que estiver corrompido ou expirado. */
export function lerSessao() {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto);
    const expira = instante(sessao?.expiraEm);
    if (!sessao?.token || !sessao?.usuario || expira === null || expira <= Date.now()) {
      limparSessao();
      return null;
    }
    return sessao;
  } catch {
    limparSessao();
    return null;
  }
}
