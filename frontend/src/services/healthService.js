import api from "./api";

export async function buscarStatusSaude() {
  const resposta = await api.get("/health");
  return resposta.data;
}
