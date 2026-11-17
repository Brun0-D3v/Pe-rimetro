import axios from "axios";
import { EVENTO_SESSAO_EXPIRADA } from "../config/authConfig";
import { lerSessao, limparSessao } from "./sessaoStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const sessao = lerSessao();
  if (sessao) {
    config.headers.Authorization = `Bearer ${sessao.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const url = erro.config?.url ?? "";
    // 401 nas rotas /auth/ é senha errada, não sessão vencida.
    if (erro.response?.status === 401 && !url.startsWith("/auth/") && lerSessao()) {
      limparSessao();
      window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA));
    }
    return Promise.reject(erro);
  }
);

export default api;
