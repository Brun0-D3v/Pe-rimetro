import { describe, expect, it } from "vitest";
import { validarCadastro, validarLogin, validarPerfil, validarTrocaDeSenha } from "./validacaoAuth";

describe("validarTrocaDeSenha", () => {
  const valido = { senhaAtual: "antiga-123", novaSenha: "nova-senha-1", confirmacao: "nova-senha-1" };

  it("aceita uma troca correta", () => {
    expect(validarTrocaDeSenha(valido)).toEqual({});
  });

  it("exige a senha atual", () => {
    expect(validarTrocaDeSenha({ ...valido, senhaAtual: "" }).senhaAtual).toBeDefined();
  });

  it("respeita os limites de 8 a 72 caracteres da nova senha", () => {
    expect(validarTrocaDeSenha({ ...valido, novaSenha: "1234567", confirmacao: "1234567" }).novaSenha).toBeDefined();
    const longa = "a".repeat(73);
    expect(validarTrocaDeSenha({ ...valido, novaSenha: longa, confirmacao: longa }).novaSenha).toBeDefined();
  });

  it("recusa nova senha igual à atual e confirmação diferente", () => {
    const igual = { senhaAtual: "mesma-senha", novaSenha: "mesma-senha", confirmacao: "mesma-senha" };
    expect(validarTrocaDeSenha(igual).novaSenha).toBe("A nova senha deve ser diferente da atual.");
    expect(validarTrocaDeSenha({ ...valido, confirmacao: "outra-coisa" }).confirmacao).toBe("As senhas não conferem.");
  });
});

describe("validarPerfil", () => {
  it("aceita nome entre 2 e 120 caracteres e rejeita fora disso", () => {
    expect(validarPerfil({ nome: "Ana" })).toEqual({});
    expect(validarPerfil({ nome: " A " }).nome).toBeDefined();
    expect(validarPerfil({ nome: "a".repeat(121) }).nome).toBeDefined();
  });
});

describe("validarLogin", () => {
  it("aceita e-mail e senha preenchidos", () => {
    expect(validarLogin({ email: "ana@exemplo.com", senha: "x" })).toEqual({});
  });

  it("aponta e-mail vazio, inválido e senha vazia", () => {
    expect(validarLogin({ email: "  ", senha: "" })).toEqual({
      email: "Informe o e-mail.",
      senha: "Informe a senha.",
    });
    expect(validarLogin({ email: "sem-arroba", senha: "x" }).email).toBe("Informe um e-mail válido.");
  });
});

describe("validarCadastro", () => {
  const valido = { nome: "Ana", email: "ana@exemplo.com", senha: "senha-segura" };

  it("aceita dados dentro dos limites do backend", () => {
    expect(validarCadastro(valido)).toEqual({});
    expect(validarCadastro({ ...valido, senha: "a".repeat(72) })).toEqual({});
  });

  it("rejeita nome curto ou só com espaços", () => {
    expect(validarCadastro({ ...valido, nome: "A" }).nome).toBeDefined();
    expect(validarCadastro({ ...valido, nome: "   " }).nome).toBeDefined();
  });

  it("rejeita nome acima de 120 caracteres", () => {
    expect(validarCadastro({ ...valido, nome: "a".repeat(121) }).nome).toBeDefined();
  });

  it("rejeita senha curta (menos de 8) e longa demais (mais de 72)", () => {
    expect(validarCadastro({ ...valido, senha: "1234567" }).senha).toBeDefined();
    expect(validarCadastro({ ...valido, senha: "a".repeat(73) }).senha).toBeDefined();
  });

  it("rejeita e-mail inválido", () => {
    expect(validarCadastro({ ...valido, email: "ana.exemplo.com" }).email).toBeDefined();
  });
});
