import api from "./api";

export async function registrar({ nome, email, senha }) {
  const resposta = await api.post("/auth/registrar", { nome, email, senha });
  return resposta.data;
}

export async function login({ email, senha }) {
  const resposta = await api.post("/auth/login", { email, senha });
  return resposta.data;
}
