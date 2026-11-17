import { describe, expect, it } from "vitest";
import { retornoSeguro } from "./rotas";

describe("retornoSeguro", () => {
  it("aceita caminhos internos", () => {
    expect(retornoSeguro("/app")).toBe("/app");
    expect(retornoSeguro("/app/dashboard?x=1")).toBe("/app/dashboard?x=1");
  });

  it("cai no mapa quando não há valor", () => {
    expect(retornoSeguro(null)).toBe("/app");
    expect(retornoSeguro(undefined)).toBe("/app");
    expect(retornoSeguro("")).toBe("/app");
  });

  it("recusa endereços externos e formas disfarçadas", () => {
    expect(retornoSeguro("https://site-malicioso.com")).toBe("/app");
    expect(retornoSeguro("//site-malicioso.com")).toBe("/app");
    expect(retornoSeguro("/\\site-malicioso.com")).toBe("/app");
    expect(retornoSeguro("javascript:alert(1)")).toBe("/app");
  });
});
