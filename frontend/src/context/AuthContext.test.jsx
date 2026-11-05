import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHAVE_SESSAO, EVENTO_SESSAO_EXPIRADA } from "../config/authConfig";
import { login, registrar } from "../services/authService";
import { salvarSessao } from "../services/sessaoStorage";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../services/authService", () => ({
  login: vi.fn(),
  registrar: vi.fn(),
}));

const ana = { id: "u1", nome: "Ana", email: "ana@exemplo.com", perfil: "CIDADAO" };
const admin = { id: "u2", nome: "Admin", email: "admin@exemplo.com", perfil: "ADMINISTRADOR" };

function resposta(usuario, minutos = 120) {
  return { token: "tok", tipo: "Bearer", expiraEm: new Date(Date.now() + minutos * 60_000).toISOString(), usuario };
}

function montar() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it("começa deslogado", () => {
    const { result } = montar();
    expect(result.current.autenticado).toBe(false);
    expect(result.current.usuario).toBeNull();
    expect(result.current.ehAdmin).toBe(false);
  });

  it("restaura a sessão salva ao montar (recarregar a página)", () => {
    salvarSessao({ ...resposta(ana) });
    const { result } = montar();
    expect(result.current.autenticado).toBe(true);
    expect(result.current.usuario).toEqual(ana);
  });

  it("ignora sessão salva já expirada", () => {
    salvarSessao({ ...resposta(ana, -5) });
    const { result } = montar();
    expect(result.current.autenticado).toBe(false);
  });

  it("entrar guarda a sessão e expõe o usuário", async () => {
    login.mockResolvedValue(resposta(ana));
    const { result } = montar();

    await act(() => result.current.entrar({ email: "ana@exemplo.com", senha: "senha-segura" }));

    expect(login).toHaveBeenCalledWith({ email: "ana@exemplo.com", senha: "senha-segura" });
    expect(result.current.autenticado).toBe(true);
    expect(JSON.parse(localStorage.getItem(CHAVE_SESSAO)).token).toBe("tok");
  });

  it("cadastrar também já deixa a pessoa logada", async () => {
    registrar.mockResolvedValue(resposta(ana));
    const { result } = montar();

    await act(() => result.current.cadastrar({ nome: "Ana", email: "ana@exemplo.com", senha: "senha-segura" }));

    expect(result.current.usuario).toEqual(ana);
  });

  it("falha de login não cria sessão e repassa o erro", async () => {
    const falha = new Error("401");
    login.mockRejectedValue(falha);
    const { result } = montar();

    await expect(act(() => result.current.entrar({ email: "a@a.com", senha: "x" }))).rejects.toBe(falha);

    expect(result.current.autenticado).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
  });

  it("ehAdmin deriva do perfil", async () => {
    login.mockResolvedValue(resposta(admin));
    const { result } = montar();
    await act(() => result.current.entrar({ email: "admin@exemplo.com", senha: "x" }));
    expect(result.current.ehAdmin).toBe(true);
  });

  it("sair limpa a sessão", async () => {
    salvarSessao({ ...resposta(ana) });
    const { result } = montar();

    act(() => result.current.sair());

    expect(result.current.autenticado).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
  });

  it("o evento de sessão expirada desloga e mostra o aviso", () => {
    salvarSessao({ ...resposta(ana) });
    const { result } = montar();

    act(() => {
      window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA));
    });

    expect(result.current.autenticado).toBe(false);
    expect(result.current.aviso).toBe("Sua sessão expirou. Entre novamente.");
  });

  it("expira sozinho no horário do token", () => {
    vi.useFakeTimers();
    salvarSessao({ ...resposta(ana, 10) });
    const { result } = montar();
    expect(result.current.autenticado).toBe(true);

    act(() => {
      vi.advanceTimersByTime(11 * 60_000);
    });

    expect(result.current.autenticado).toBe(false);
    expect(result.current.aviso).not.toBeNull();
  });

  it("entrar de novo limpa o aviso de expiração", async () => {
    salvarSessao({ ...resposta(ana) });
    login.mockResolvedValue(resposta(ana));
    const { result } = montar();
    act(() => {
      window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA));
    });
    expect(result.current.aviso).not.toBeNull();

    await act(() => result.current.entrar({ email: "ana@exemplo.com", senha: "x" }));

    expect(result.current.aviso).toBeNull();
  });

  it("useAuth fora do provider lança erro claro", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth precisa ser usado dentro de um AuthProvider");
  });
});
