import api from "./api";

export async function buscarMinhasAvaliacoes({ pagina = 0, tamanho = 20 } = {}) {
  const resposta = await api.get("/usuarios/me/avaliacoes", { params: { pagina, tamanho } });
  return resposta.data;
}

export async function buscarResumo() {
  const resposta = await api.get("/usuarios/me/resumo");
  return resposta.data;
}

export async function alterarSenha({ senhaAtual, novaSenha }) {
  await api.put("/usuarios/me/senha", { senhaAtual, novaSenha });
}
