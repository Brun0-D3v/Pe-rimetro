package br.com.perimetro.dto;

public class ResumoAtividadeDto {

    private final long totalAvaliacoes;

    public ResumoAtividadeDto(long totalAvaliacoes) {
        this.totalAvaliacoes = totalAvaliacoes;
    }

    public long getTotalAvaliacoes() {
        return totalAvaliacoes;
    }
}
