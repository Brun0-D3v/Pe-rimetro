import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import { atualizarPerfil } from "../../services/authService";
import DadosConta from "./DadosConta";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../services/authService", () => ({ atualizarPerfil: vi.fn() }));

const ana = { id: "u1", nome: "Ana", email: "ana@exemplo.com", perfil: "CIDADAO" };

describe("DadosConta", () => {
  let atualizarUsuario;

  beforeEach(() => {
    vi.clearAllMocks();
    atualizarUsuario = vi.fn();
    useAuth.mockReturnValue({ usuario: ana, atualizarUsuario });
  });
  afterEach(cleanup);

  it("mostra e-mail, perfil e nome atuais", () => {
    render(<DadosConta />);
    expect(screen.getByText("ana@exemplo.com")).toBeTruthy();
    expect(screen.getByText("Cidadão")).toBeTruthy();
    expect(screen.getByLabelText("Nome").value).toBe("Ana");
  });

  it("só habilita salvar quando o nome mudou", () => {
    render(<DadosConta />);
    const botao = screen.getByRole("button", { name: "Salvar alterações" });
    expect(botao.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana Maria" } });
    expect(botao.disabled).toBe(false);
  });

  it("salva o nome novo e atualiza a sessão", async () => {
    atualizarPerfil.mockResolvedValue({ ...ana, nome: "Ana Maria" });
    render(<DadosConta />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "  Ana Maria " } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Perfil atualizado."));
    expect(atualizarPerfil).toHaveBeenCalledWith({ nome: "Ana Maria" });
    expect(atualizarUsuario).toHaveBeenCalledWith({ ...ana, nome: "Ana Maria" });
  });

  it("não chama o servidor com nome curto demais", () => {
    render(<DadosConta />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(atualizarPerfil).not.toHaveBeenCalled();
    expect(screen.getByText(/O nome deve ter entre 2 e 120/)).toBeTruthy();
  });

  it("mostra a mensagem do backend quando salvar falha", async () => {
    atualizarPerfil.mockRejectedValue({ response: { data: { mensagem: "Sessão inválida" } } });
    render(<DadosConta />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana Maria" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Sessão inválida");
    expect(atualizarUsuario).not.toHaveBeenCalled();
  });
});
