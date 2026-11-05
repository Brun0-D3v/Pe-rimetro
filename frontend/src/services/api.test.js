import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHAVE_SESSAO, EVENTO_SESSAO_EXPIRADA } from "../config/authConfig";
import api from "./api";
import { salvarSessao } from "./sessaoStorage";

const usuario = { id: "u1", nome: "Ana", email: "ana@exemplo.com", perfil: "CIDADAO" };

function entrarComoAna() {
  salvarSessao({ token: "meu-token", expiraEm: new Date(Date.now() + 3600_000).toISOString(), usuario });
}

// Adaptador falso: registra a configuração enviada e responde com o status pedido.
function simularResposta(status) {
  const enviadas = [];
  api.defaults.adapter = async (config) => {
    enviadas.push(config);
    const resposta = { data: {}, status, statusText: "", headers: {}, config };
    if (status >= 400) {
      const { AxiosError } = await import("axios");
      throw new AxiosError("falhou", String(status), config, null, resposta);
    }
    return resposta;
  };
  return enviadas;
}

describe("api (axios)", () => {
  const original = api.defaults.adapter;

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    api.defaults.adapter = original;
  });

  it("anexa o Bearer quando há sessão", async () => {
    entrarComoAna();
    const enviadas = simularResposta(200);
    await api.get("/trechos");
    expect(enviadas[0].headers.Authorization).toBe("Bearer meu-token");
  });

  it("não envia Authorization quando não há sessão", async () => {
    const enviadas = simularResposta(200);
    await api.get("/trechos");
    expect(enviadas[0].headers.Authorization).toBeUndefined();
  });

  it("401 numa requisição autenticada limpa a sessão e avisa", async () => {
    entrarComoAna();
    simularResposta(401);
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);

    await expect(api.post("/trechos/1/avaliacoes", {})).rejects.toBeTruthy();

    window.removeEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
  });

  it("401 em /auth/login (senha errada) não derruba a sessão nem avisa", async () => {
    entrarComoAna();
    simularResposta(401);
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);

    await expect(api.post("/auth/login", {})).rejects.toBeTruthy();

    window.removeEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    expect(ouvinte).not.toHaveBeenCalled();
    expect(localStorage.getItem(CHAVE_SESSAO)).not.toBeNull();
  });

  it("401 sem sessão não dispara aviso de expiração", async () => {
    simularResposta(401);
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);

    await expect(api.get("/usuarios/me")).rejects.toBeTruthy();

    window.removeEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    expect(ouvinte).not.toHaveBeenCalled();
  });
});
