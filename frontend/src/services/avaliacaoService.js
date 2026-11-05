import api from "./api";

export async function enviarAvaliacao(trechoId, notas) {
  const resposta = await api.post(`/trechos/${trechoId}/avaliacoes`, notas);
  return resposta.data;
}
