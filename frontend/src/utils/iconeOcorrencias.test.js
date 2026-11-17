import { describe, expect, it } from "vitest";
import { iconeOcorrencias } from "./iconeOcorrencias";

describe("iconeOcorrencias", () => {
  it("devolve a mesma instância para o mesmo total", () => {
    expect(iconeOcorrencias(3)).toBe(iconeOcorrencias(3));
    expect(iconeOcorrencias(3)).not.toBe(iconeOcorrencias(4));
  });

  it("converte o total para número antes de montar o HTML", () => {
    const icone = iconeOcorrencias("5<script>");
    expect(icone.options.html).not.toContain("<script>");
  });
});
