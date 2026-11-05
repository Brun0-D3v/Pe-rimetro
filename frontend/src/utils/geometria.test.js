import { describe, expect, it } from "vitest";
import { comprimentoMetros, distanciaMetros, pontoMedio, regiaoMaisProxima } from "./geometria";

describe("geometria", () => {
  it("0,01 grau de latitude equivale a cerca de 1112 m", () => {
    expect(distanciaMetros({ lat: -8, lng: -34 }, { lat: -8.01, lng: -34 })).toBeCloseTo(1111.95, 0);
  });

  it("pontos iguais têm distância zero", () => {
    expect(distanciaMetros({ lat: -8, lng: -34 }, { lat: -8, lng: -34 })).toBe(0);
  });

  it("comprimento soma os segmentos", () => {
    const pontos = [
      { lat: -8.0, lng: -34 },
      { lat: -8.01, lng: -34 },
      { lat: -8.02, lng: -34 },
    ];
    expect(comprimentoMetros(pontos)).toBeCloseTo(2223.9, 0);
  });

  it("comprimento de lista vazia ou de um ponto é zero", () => {
    expect(comprimentoMetros([])).toBe(0);
    expect(comprimentoMetros([{ lat: -8, lng: -34 }])).toBe(0);
  });

  it("ponto médio é a média das coordenadas", () => {
    expect(pontoMedio([{ lat: -8, lng: -34 }, { lat: -10, lng: -36 }])).toEqual({ lat: -9, lng: -35 });
  });

  describe("regiaoMaisProxima", () => {
    const trechos = [
      { regiaoId: "A", geometria: [{ lat: -8.0, lng: -34.9 }] },
      { regiaoId: "B", geometria: [{ lat: -8.2, lng: -34.9 }] },
    ];

    it("devolve a região do trecho mais próximo do primeiro ponto", () => {
      expect(regiaoMaisProxima([{ lat: -8.19, lng: -34.9 }], trechos)).toBe("B");
      expect(regiaoMaisProxima([{ lat: -8.01, lng: -34.9 }], trechos)).toBe("A");
    });

    it("devolve null sem pontos ou sem trechos", () => {
      expect(regiaoMaisProxima([], trechos)).toBeNull();
      expect(regiaoMaisProxima([{ lat: -8, lng: -34 }], [])).toBeNull();
    });
  });
});
