package br.com.perimetro.dto;

import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Classificacao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.service.CalculadoraIndice;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Uma avaliação do próprio usuário, para o histórico do perfil. O {@code indice} é o das 6 notas
 * desta avaliação (calculado na hora, sem gravar nada); o {@code indiceAtualDoTrecho} é o do trecho
 * hoje, resultado da média de todas as avaliações.
 */
public class MinhaAvaliacaoDto {

    private final UUID id;
    private final UUID trechoId;
    private final String trechoNome;
    private final int notaCalcada;
    private final int notaAcessibilidade;
    private final int notaIluminacao;
    private final int notaArborizacao;
    private final int notaTravessias;
    private final int notaMobiliario;
    private final BigDecimal indice;
    private final Classificacao classificacao;
    private final BigDecimal indiceAtualDoTrecho;
    private final Instant criadoEm;

    public MinhaAvaliacaoDto(Avaliacao avaliacao) {
        Trecho trecho = avaliacao.getTrecho();
        this.id = avaliacao.getId();
        this.trechoId = trecho.getId();
        this.trechoNome = trecho.getNome();
        this.notaCalcada = avaliacao.getNotaCalcada();
        this.notaAcessibilidade = avaliacao.getNotaAcessibilidade();
        this.notaIluminacao = avaliacao.getNotaIluminacao();
        this.notaArborizacao = avaliacao.getNotaArborizacao();
        this.notaTravessias = avaliacao.getNotaTravessias();
        this.notaMobiliario = avaliacao.getNotaMobiliario();
        this.indice = CalculadoraIndice.indice(notaCalcada, notaAcessibilidade, notaIluminacao,
                notaArborizacao, notaTravessias, notaMobiliario);
        this.classificacao = Classificacao.de(this.indice);
        this.indiceAtualDoTrecho = trecho.getIndiceAtual();
        this.criadoEm = avaliacao.getCriadoEm();
    }

    public UUID getId() {
        return id;
    }

    public UUID getTrechoId() {
        return trechoId;
    }

    public String getTrechoNome() {
        return trechoNome;
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

    public BigDecimal getIndice() {
        return indice;
    }

    public Classificacao getClassificacao() {
        return classificacao;
    }

    public BigDecimal getIndiceAtualDoTrecho() {
        return indiceAtualDoTrecho;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }
}
