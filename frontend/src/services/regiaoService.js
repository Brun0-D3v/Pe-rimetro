import api from "./api";

export async function buscarRegioes() {
  const resposta = await api.get("/regioes");
  return resposta.data;
}
