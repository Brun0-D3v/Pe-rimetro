import { describe, expect, it } from "vitest";
import { MAX_BYTES, validarFoto } from "./ocorrenciaConfig";

const arquivo = (tipo, tamanho) => ({ type: tipo, size: tamanho, name: "f" });

describe("validarFoto", () => {
  it("aceita jpeg, png e webp dentro do limite", () => {
    for (const tipo of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validarFoto(arquivo(tipo, 1000))).toBeNull();
    }
  });
  it("recusa outros tipos", () => {
    expect(validarFoto(arquivo("application/pdf", 1000))).toMatch(/JPEG, PNG ou WebP/);
  });
  it("recusa arquivo acima de 5 MB", () => {
    expect(validarFoto(arquivo("image/png", MAX_BYTES + 1))).toMatch(/5 MB/);
  });
  it("aceita exatamente 5 MB", () => {
    expect(validarFoto(arquivo("image/png", MAX_BYTES))).toBeNull();
  });
});
