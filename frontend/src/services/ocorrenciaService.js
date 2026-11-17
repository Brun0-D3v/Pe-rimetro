import api from "./api";

export async function listarCategorias() {
  return (await api.get("/categorias")).data;
}

export async function criarOcorrencia(trechoId, { categoriaId, descricao }) {
  return (await api.post(`/trechos/${trechoId}/ocorrencias`, { categoriaId, descricao })).data;
}

export async function enviarFoto(ocorrenciaId, arquivo) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  return (await api.post(`/ocorrencias/${ocorrenciaId}/fotos`, form)).data;
}

export function urlDaFoto(fotoId) {
  return `${import.meta.env.VITE_API_URL}/fotos/${fotoId}`;
}

export async function buscarContagemPorTrecho() {
  return (await api.get("/ocorrencias/contagem-por-trecho")).data;
}

export async function listarDoTrecho(trechoId, { pagina = 0, tamanho = 10 } = {}) {
  return (await api.get(`/trechos/${trechoId}/ocorrencias`, { params: { pagina, tamanho } })).data;
}

export async function editarOcorrencia(id, { categoriaId, descricao }) {
  return (await api.put(`/ocorrencias/${id}`, { categoriaId, descricao })).data;
}

export async function excluirOcorrencia(id) {
  await api.delete(`/ocorrencias/${id}`);
}

export async function listarParaModeracao({ status, moderadasPorMim, pagina = 0, tamanho = 20 } = {}) {
  const params = { pagina, tamanho };
  if (status) params.status = status;
  if (moderadasPorMim) params.moderadasPorMim = true;
  return (await api.get("/ocorrencias", { params })).data;
}

export async function alterarVisibilidade(id, status) {
  return (await api.patch(`/ocorrencias/${id}`, { status })).data;
}
