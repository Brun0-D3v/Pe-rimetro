import api from "./api";

export async function buscarTrechos(regiaoId) {
  const resposta = await api.get("/trechos", {
    params: regiaoId ? { regiaoId } : undefined,
  });
  return resposta.data;
}
