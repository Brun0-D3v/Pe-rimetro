import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { motivoDoTracadoInvalido, useDesenhoTrecho } from "./useDesenhoTrecho";

const A = { lat: -8.0631, lng: -34.8711 };
const B = { lat: -8.064, lng: -34.872 }; // cerca de 140 m de A
const C = { lat: -8.065, lng: -34.873 };

function marcar(resultado, ...pontos) {
  for (const ponto of pontos) {
    act(() => resultado.current.adicionarPonto(ponto));
  }
}

describe("useDesenhoTrecho", () => {
  it("começa sem pontos, com comprimento zero e pedindo ao menos 2 pontos", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    expect(result.current.pontos).toEqual([]);
    expect(result.current.comprimento).toBe(0);
    expect(result.current.motivoInvalido).toBe("Marque pelo menos 2 pontos no mapa.");
  });

  it("acumula pontos na ordem e soma o comprimento", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    marcar(result, A, B, C);
    expect(result.current.pontos).toEqual([A, B, C]);
    expect(result.current.comprimento).toBeGreaterThan(250);
    expect(result.current.motivoInvalido).toBeNull();
  });

  it("ignora um ponto a menos de 2 m do anterior (clique duplo)", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    marcar(result, A, { lat: A.lat + 0.00001, lng: A.lng }); // cerca de 1,1 m
    expect(result.current.pontos).toEqual([A]);
  });

  it("desfaz o último ponto", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    marcar(result, A, B);
    act(() => result.current.desfazerPonto());
    expect(result.current.pontos).toEqual([A]);
  });

  it("desfazer sem pontos não quebra", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    act(() => result.current.desfazerPonto());
    expect(result.current.pontos).toEqual([]);
  });

  it("limpa todos os pontos", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    marcar(result, A, B);
    act(() => result.current.limpar());
    expect(result.current.pontos).toEqual([]);
  });

  it("não passa de 200 pontos", () => {
    const { result } = renderHook(() => useDesenhoTrecho());
    for (let i = 0; i < 205; i += 1) {
      marcar(result, { lat: -8 - i * 0.0001, lng: -34.87 });
    }
    expect(result.current.pontos).toHaveLength(200);
  });
});

describe("motivoDoTracadoInvalido", () => {
  it("pede mais pontos", () => {
    expect(motivoDoTracadoInvalido(0, 0)).toBe("Marque pelo menos 2 pontos no mapa.");
    expect(motivoDoTracadoInvalido(1, 0)).toBe("Marque pelo menos 2 pontos no mapa.");
  });

  it("recusa trecho curto demais", () => {
    expect(motivoDoTracadoInvalido(2, 1)).toBe("Trecho curto demais (mínimo 5 m).");
  });

  it("recusa trecho longo demais", () => {
    expect(motivoDoTracadoInvalido(2, 6000)).toBe("Trecho longo demais (máximo 5000 m).");
  });

  it("aceita um trecho dentro dos limites", () => {
    expect(motivoDoTracadoInvalido(2, 100)).toBeNull();
  });
});
