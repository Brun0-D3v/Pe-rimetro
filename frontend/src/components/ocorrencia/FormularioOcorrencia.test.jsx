import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarOcorrencia, enviarFoto, listarCategorias } from "../../services/ocorrenciaService";
import FormularioOcorrencia from "./FormularioOcorrencia";

vi.mock("../../services/ocorrenciaService");

const categorias = [
  { id: "c1", nome: "Calçada quebrada" },
  { id: "c2", nome: "Falta de iluminação" },
  { id: "c3", nome: "Sem rampa" },
  { id: "c4", nome: "Obstáculo" },
];

const foto = (nome, tipo = "image/png", tamanho = 1000) => {
  const arquivo = new File(["x"], nome, { type: tipo });
  Object.defineProperty(arquivo, "size", { value: tamanho });
  return arquivo;
};

function montar() {
  const aoConcluir = vi.fn();
  const aoCancelar = vi.fn();
  render(<FormularioOcorrencia trechoId="t1" aoConcluir={aoConcluir} aoCancelar={aoCancelar} />);
  return { aoConcluir, aoCancelar };
}

async function escolherCategoria() {
  await screen.findByRole("option", { name: "Sem rampa" });
  fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "c3" } });
}

function anexar(...arquivos) {
  fireEvent.change(screen.getByLabelText(/Fotos/), { target: { files: arquivos } });
}

const enviar = () => fireEvent.click(screen.getByRole("button", { name: "Enviar ocorrência" }));

describe("FormularioOcorrencia", () => {
  beforeEach(() => {
    listarCategorias.mockResolvedValue(categorias);
    criarOcorrencia.mockResolvedValue({ id: "o1" });
    enviarFoto.mockResolvedValue({ id: "f1" });
    let contador = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++contador}`);
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("carrega categorias num select", async () => {
    montar();
    await screen.findByRole("option", { name: "Sem rampa" });
    expect(screen.getAllByRole("option")).toHaveLength(5);
  });

  it("enviar sem categoria mostra erro e não chama a API", async () => {
    montar();
    await screen.findByRole("option", { name: "Sem rampa" });
    enviar();
    expect(screen.getByText("Escolha uma categoria")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Categoria"));
    expect(criarOcorrencia).not.toHaveBeenCalled();
  });

  it("descrição tem contador e maxLength de 500", () => {
    montar();
    const campo = screen.getByLabelText(/Descrição/);
    expect(campo.getAttribute("maxlength")).toBe("500");
    expect(screen.getByText("0/500")).toBeTruthy();
    fireEvent.change(campo, { target: { value: "abc" } });
    expect(screen.getByText("3/500")).toBeTruthy();
  });

  it("foto de tipo inválido mostra a mensagem e não entra na lista", () => {
    montar();
    anexar(foto("a.pdf", "application/pdf"));
    expect(screen.getByText(/JPEG, PNG ou WebP/)).toBeTruthy();
    expect(screen.queryByText("a.pdf")).toBeNull();
  });

  it("a 4ª foto é recusada", () => {
    montar();
    anexar(foto("1.png"), foto("2.png"), foto("3.png"));
    anexar(foto("4.png"));
    expect(screen.getByText("No máximo 3 fotos")).toBeTruthy();
    expect(screen.queryByText("4.png")).toBeNull();
    expect(screen.getByText("3.png")).toBeTruthy();
  });

  it("revoga a URL da prévia ao remover a foto", () => {
    montar();
    anexar(foto("1.png"));
    fireEvent.click(screen.getByRole("button", { name: "Remover foto 1.png" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
    expect(screen.queryByText("1.png")).toBeNull();
  });

  it("revoga as URLs ao desmontar", () => {
    montar();
    anexar(foto("1.png"));
    cleanup();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
  });

  it("envio feliz sem foto", async () => {
    const { aoConcluir } = montar();
    await escolherCategoria();
    enviar();
    await waitFor(() => expect(aoConcluir).toHaveBeenCalled());
    expect(criarOcorrencia).toHaveBeenCalledTimes(1);
    expect(criarOcorrencia).toHaveBeenCalledWith("t1", { categoriaId: "c3", descricao: "" });
    expect(enviarFoto).not.toHaveBeenCalled();
  });

  it("envio feliz com 2 fotos cria e depois envia cada foto", async () => {
    const { aoConcluir } = montar();
    await escolherCategoria();
    const a = foto("a.png");
    const b = foto("b.png");
    anexar(a, b);
    enviar();
    await waitFor(() => expect(aoConcluir).toHaveBeenCalled());
    expect(enviarFoto).toHaveBeenCalledTimes(2);
    expect(enviarFoto).toHaveBeenNthCalledWith(1, "o1", a);
    expect(enviarFoto).toHaveBeenNthCalledWith(2, "o1", b);
    expect(criarOcorrencia.mock.invocationCallOrder[0]).toBeLessThan(enviarFoto.mock.invocationCallOrder[0]);
  });

  it("foto que falha depois de criar permite tentar de novo só ela", async () => {
    const { aoConcluir } = montar();
    await escolherCategoria();
    anexar(foto("a.png"), foto("b.png"));
    enviarFoto.mockResolvedValueOnce({ id: "f1" }).mockRejectedValueOnce(new Error("falhou"));
    enviar();
    await screen.findByText(/Ocorrência registrada, mas a foto b\.png não foi enviada/);
    expect(aoConcluir).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: /Tentar de novo/ })).toHaveLength(1);

    enviarFoto.mockResolvedValueOnce({ id: "f2" });
    fireEvent.click(screen.getByRole("button", { name: /Tentar de novo/ }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /Tentar de novo/ })).toBeNull());
    expect(criarOcorrencia).toHaveBeenCalledTimes(1);
    expect(enviarFoto).toHaveBeenCalledTimes(3);
  });

  it("erro do servidor na criação mostra a mensagem e mantém o formulário preenchido", async () => {
    const { aoConcluir } = montar();
    criarOcorrencia.mockRejectedValue({ response: { data: { mensagem: "Trecho inativo" } } });
    await escolherCategoria();
    fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: "buraco grande" } });
    enviar();
    await screen.findByText("Trecho inativo");
    expect(screen.getByLabelText(/Descrição/).value).toBe("buraco grande");
    expect(screen.getByLabelText("Categoria").value).toBe("c3");
    expect(aoConcluir).not.toHaveBeenCalled();
  });
});
