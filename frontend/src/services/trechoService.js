import api from "./api";

export async function buscarTrechos() {
  const resposta = await api.get("/trechos");
  return resposta.data;
}
