import { describe, expect, it } from "vitest";
import {
  COR_SEM_AVALIACAO,
  corDoTrecho,
  formatarIndice,
  rotuloDaClassificacao,
  tomDaClassificacao,
} from "./indiceConfig";

describe("indiceConfig", () => {
  it("devolve a cor de cada faixa", () => {
    expect(corDoTrecho("BOM")).toBe("#34d399");
    expect(corDoTrecho("MEDIO")).toBe("#fbbf24");
    expect(corDoTrecho("RUIM")).toBe("#f87171");
  });

  it("trecho sem classificação usa a cor neutra", () => {
    expect(corDoTrecho(null)).toBe(COR_SEM_AVALIACAO);
    expect(corDoTrecho(undefined)).toBe(COR_SEM_AVALIACAO);
  });

  it("converte a classificação em tom do Badge", () => {
    expect(tomDaClassificacao("BOM")).toBe("bom");
    expect(tomDaClassificacao("MEDIO")).toBe("medio");
    expect(tomDaClassificacao("RUIM")).toBe("ruim");
    expect(tomDaClassificacao(null)).toBe("neutro");
  });

  it("traduz a classificação em rótulo", () => {
    expect(rotuloDaClassificacao("BOM")).toBe("Bom");
    expect(rotuloDaClassificacao("MEDIO")).toBe("Médio");
    expect(rotuloDaClassificacao("RUIM")).toBe("Ruim");
    expect(rotuloDaClassificacao(null)).toBe("Sem avaliações");
  });

  it("formata o índice com uma casa decimal e vírgula", () => {
    expect(formatarIndice(5.4)).toBe("5,4");
    expect(formatarIndice(7)).toBe("7,0");
    expect(formatarIndice(6.95)).toBe("7,0");
    expect(formatarIndice(10)).toBe("10,0");
  });

  it("índice nulo vira o texto 'Sem índice'", () => {
    expect(formatarIndice(null)).toBe("Sem índice");
    expect(formatarIndice(undefined)).toBe("Sem índice");
  });
});
