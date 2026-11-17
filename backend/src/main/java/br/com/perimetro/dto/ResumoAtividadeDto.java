package br.com.perimetro.dto;

public class ResumoAtividadeDto {

    private final long totalAvaliacoes;
    private final long totalOcorrencias;

    public ResumoAtividadeDto(long totalAvaliacoes, long totalOcorrencias) {
        this.totalAvaliacoes = totalAvaliacoes;
        this.totalOcorrencias = totalOcorrencias;
    }

    public long getTotalAvaliacoes() {
        return totalAvaliacoes;
    }

    public long getTotalOcorrencias() {
        return totalOcorrencias;
    }
}
