package br.com.perimetro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "avaliacao")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trecho_id", nullable = false)
    private Trecho trecho;

    // Nulo até a Sprint 04 (autenticação); a FK para usuario é criada lá.
    @Column(name = "usuario_id")
    private UUID usuarioId;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_calcada", nullable = false)
    private int notaCalcada;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_acessibilidade", nullable = false)
    private int notaAcessibilidade;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_iluminacao", nullable = false)
    private int notaIluminacao;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_arborizacao", nullable = false)
    private int notaArborizacao;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_travessias", nullable = false)
    private int notaTravessias;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "nota_mobiliario", nullable = false)
    private int notaMobiliario;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected Avaliacao() {
    }

    public Avaliacao(Trecho trecho, int notaCalcada, int notaAcessibilidade, int notaIluminacao,
                     int notaArborizacao, int notaTravessias, int notaMobiliario) {
        this.trecho = trecho;
        this.notaCalcada = notaCalcada;
        this.notaAcessibilidade = notaAcessibilidade;
        this.notaIluminacao = notaIluminacao;
        this.notaArborizacao = notaArborizacao;
        this.notaTravessias = notaTravessias;
        this.notaMobiliario = notaMobiliario;
        this.criadoEm = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Trecho getTrecho() {
        return trecho;
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

    public Instant getCriadoEm() {
        return criadoEm;
    }
}
