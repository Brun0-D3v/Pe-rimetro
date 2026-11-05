import { beforeEach, describe, expect, it } from "vitest";
import { CHAVE_SESSAO } from "../config/authConfig";
import { lerSessao, limparSessao, salvarSessao } from "./sessaoStorage";

const usuario = { id: "u1", nome: "Ana", email: "ana@exemplo.com", perfil: "CIDADAO" };

function sessaoValida(extra = {}) {
  return { token: "abc", expiraEm: new Date(Date.now() + 3600_000).toISOString(), usuario, ...extra };
}

describe("sessaoStorage", () => {
  beforeEach(() => localStorage.clear());

  it("devolve nulo quando não há sessão", () => {
    expect(lerSessao()).toBeNull();
  });

  it("salva e restaura uma sessão válida", () => {
    const sessao = sessaoValida();
    salvarSessao(sessao);
    expect(lerSessao()).toEqual(sessao);
  });

  it("descarta e apaga a sessão expirada", () => {
    salvarSessao(sessaoValida({ expiraEm: new Date(Date.now() - 1000).toISOString() }));
    expect(lerSessao()).toBeNull();
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
  });

  it("descarta e apaga conteúdo corrompido", () => {
    localStorage.setItem(CHAVE_SESSAO, "{isto não é json");
    expect(lerSessao()).toBeNull();
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
  });

  it("descarta sessão sem token, sem usuário ou com data inválida", () => {
    for (const ruim of [
      sessaoValida({ token: "" }),
      sessaoValida({ usuario: null }),
      sessaoValida({ expiraEm: "ontem" }),
    ]) {
      salvarSessao(ruim);
      expect(lerSessao()).toBeNull();
    }
  });

  it("limparSessao remove o que foi salvo", () => {
    salvarSessao(sessaoValida());
    limparSessao();
    expect(lerSessao()).toBeNull();
  });
});
