package br.com.perimetro.dto;

import br.com.perimetro.entity.Avaliacao;

import java.time.Instant;
import java.util.UUID;

public class AvaliacaoResponseDto {

    private final UUID id;
    private final Instant criadoEm;
    private final int notaCalcada;
    private final int notaAcessibilidade;
    private final int notaIluminacao;
    private final int notaArborizacao;
    private final int notaTravessias;
    private final int notaMobiliario;
    private final TrechoResponseDto trecho;

    public AvaliacaoResponseDto(Avaliacao avaliacao, TrechoResponseDto trecho) {
        this.id = avaliacao.getId();
        this.criadoEm = avaliacao.getCriadoEm();
        this.notaCalcada = avaliacao.getNotaCalcada();
        this.notaAcessibilidade = avaliacao.getNotaAcessibilidade();
        this.notaIluminacao = avaliacao.getNotaIluminacao();
        this.notaArborizacao = avaliacao.getNotaArborizacao();
        this.notaTravessias = avaliacao.getNotaTravessias();
        this.notaMobiliario = avaliacao.getNotaMobiliario();
        this.trecho = trecho;
    }

    public UUID getId() {
        return id;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public int getNotaCalcada() {
        return notaCalcada;
    }

    public int getNotaAcessibilidade() {
        return notaAcessibilidade;
    }

    public int getNotaIluminacao() {
        return notaIluminacao;
    }

    public int getNotaArborizacao() {
        return notaArborizacao;
    }

    public int getNotaTravessias() {
        return notaTravessias;
    }

    public int getNotaMobiliario() {
        return notaMobiliario;
    }

    public TrechoResponseDto getTrecho() {
        return trecho;
    }
}
