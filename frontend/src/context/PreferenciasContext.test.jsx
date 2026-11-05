import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PreferenciasAcessibilidade from "../components/perfil/PreferenciasAcessibilidade";
import { CHAVE_PREFERENCIAS } from "../config/preferenciasConfig";
import { usePreferencias } from "../hooks/usePreferencias";
import { PreferenciasProvider } from "./PreferenciasContext";

function montarHook() {
  return renderHook(() => usePreferencias(), { wrapper: PreferenciasProvider });
}

describe("PreferenciasContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.fontSize = "";
  });
  afterEach(cleanup);

  it("começa no tamanho normal (100%)", () => {
    const { result } = montarHook();
    expect(result.current.tamanhoFonte).toBe("normal");
    expect(document.documentElement.style.fontSize).toBe("100%");
  });

  it("aplica o tamanho escolhido na raiz e guarda no navegador", () => {
    const { result } = montarHook();

    act(() => result.current.definirTamanhoFonte("maior"));

    expect(document.documentElement.style.fontSize).toBe("125%");
    expect(JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS))).toEqual({ tamanhoFonte: "maior" });
  });

  it("restaura a preferência salva ao montar", () => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ tamanhoFonte: "grande" }));
    const { result } = montarHook();
    expect(result.current.tamanhoFonte).toBe("grande");
    expect(document.documentElement.style.fontSize).toBe("112.5%");
  });

  it("valor salvo inválido ou corrompido volta ao padrão", () => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ tamanhoFonte: "gigante" }));
    expect(montarHook().result.current.tamanhoFonte).toBe("normal");

    localStorage.setItem(CHAVE_PREFERENCIAS, "{não é json");
    expect(montarHook().result.current.tamanhoFonte).toBe("normal");
  });

  it("ignora tentativa de definir um tamanho que não existe", () => {
    const { result } = montarHook();
    act(() => result.current.definirTamanhoFonte("enorme"));
    expect(result.current.tamanhoFonte).toBe("normal");
  });

  it("usePreferencias fora do provider lança erro claro", () => {
    expect(() => renderHook(() => usePreferencias())).toThrow(
      "usePreferencias precisa ser usado dentro de um PreferenciasProvider"
    );
  });

  it("o seletor da tela troca o tamanho", () => {
    render(
      <PreferenciasProvider>
        <PreferenciasAcessibilidade />
      </PreferenciasProvider>
    );

    expect(screen.getByLabelText("Normal").checked).toBe(true);
    fireEvent.click(screen.getByLabelText("Grande"));

    expect(screen.getByLabelText("Grande").checked).toBe(true);
    expect(document.documentElement.style.fontSize).toBe("112.5%");
  });
});
