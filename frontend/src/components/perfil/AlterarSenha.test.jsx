import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { alterarSenha } from "../../services/usuarioService";
import AlterarSenha from "./AlterarSenha";

vi.mock("../../services/usuarioService", () => ({ alterarSenha: vi.fn() }));

function preencher(atual, nova, confirmacao) {
  fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: atual } });
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: nova } });
  fireEvent.change(screen.getByLabelText("Repita a nova senha"), { target: { value: confirmacao } });
}

function enviar() {
  fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
}

describe("AlterarSenha", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("troca a senha, mostra confirmação e limpa os campos", async () => {
    alterarSenha.mockResolvedValue();
    render(<AlterarSenha />);

    preencher("senha-antiga", "senha-nova-1", "senha-nova-1");
    enviar();

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Senha alterada."));
    expect(alterarSenha).toHaveBeenCalledWith({ senhaAtual: "senha-antiga", novaSenha: "senha-nova-1" });
    expect(screen.getByLabelText("Senha atual").value).toBe("");
    expect(screen.getByLabelText("Nova senha").value).toBe("");
  });

  it("não chama o servidor quando a confirmação não confere e foca o campo", () => {
    render(<AlterarSenha />);

    preencher("senha-antiga", "senha-nova-1", "outra-coisa-1");
    enviar();

    expect(alterarSenha).not.toHaveBeenCalled();
    expect(screen.getByText("As senhas não conferem.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Repita a nova senha"));
  });

  it("valida senha atual vazia, nova curta e nova igual à atual", () => {
    render(<AlterarSenha />);

    preencher("", "curta", "curta");
    enviar();
    expect(screen.getByText("Informe a senha atual.")).toBeTruthy();
    expect(screen.getByText(/A nova senha deve ter entre 8 e 72/)).toBeTruthy();

    preencher("mesma-senha-1", "mesma-senha-1", "mesma-senha-1");
    enviar();
    expect(screen.getByText("A nova senha deve ser diferente da atual.")).toBeTruthy();
    expect(alterarSenha).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do backend quando a senha atual está errada", async () => {
    alterarSenha.mockRejectedValue({ response: { status: 400, data: { mensagem: "Senha atual incorreta" } } });
    render(<AlterarSenha />);

    preencher("senha-errada", "senha-nova-1", "senha-nova-1");
    enviar();

    expect((await screen.findByRole("alert")).textContent).toBe("Senha atual incorreta");
    expect(screen.queryByText("Senha alterada.")).toBeNull();
  });
});
