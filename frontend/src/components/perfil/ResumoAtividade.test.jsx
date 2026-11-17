import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useResumoAtividade } from "../../hooks/useResumoAtividade";
import ResumoAtividade from "./ResumoAtividade";

vi.mock("../../hooks/useResumoAtividade", () => ({ useResumoAtividade: vi.fn() }));

describe("ResumoAtividade", () => {
  afterEach(cleanup);

  it("mostra os cards de avaliações e de ocorrências", () => {
    useResumoAtividade.mockReturnValue({ resumo: { totalAvaliacoes: 3, totalOcorrencias: 7 }, erro: false });
    render(<ResumoAtividade />);
    expect(screen.getByText("Ocorrências").nextSibling.textContent).toBe("7");
    expect(screen.getByText("Avaliações").nextSibling.textContent).toBe("3");
  });
});
