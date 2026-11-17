package br.com.perimetro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ocorrencia")
public class Ocorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trecho_id", nullable = false)
    private Trecho trecho;

    @Column(name = "usuario_id")
    private UUID usuarioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private CategoriaOcorrencia categoria;

    @Column(length = 500)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StatusOcorrencia status;

    @Column(name = "moderada_por_id")
    private UUID moderadaPorId;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected Ocorrencia() {
    }

    public Ocorrencia(Trecho trecho, CategoriaOcorrencia categoria, String descricao, UUID usuarioId) {
        this.trecho = trecho;
        this.categoria = categoria;
        this.descricao = descricao;
        this.usuarioId = usuarioId;
        this.status = StatusOcorrencia.VISIVEL;
        this.criadoEm = Instant.now();
        this.atualizadoEm = this.criadoEm;
    }

    public void editar(CategoriaOcorrencia categoria, String descricao) {
        this.categoria = categoria;
        this.descricao = descricao;
        this.atualizadoEm = Instant.now();
    }

    public void definirStatus(StatusOcorrencia novo, UUID administradorId) {
        this.status = novo;
        this.moderadaPorId = administradorId;
        this.atualizadoEm = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Trecho getTrecho() {
        return trecho;
    }

    public UUID getUsuarioId() {
        return usuarioId;
    }

    public CategoriaOcorrencia getCategoria() {
        return categoria;
    }

    public String getDescricao() {
        return descricao;
    }

    public StatusOcorrencia getStatus() {
        return status;
    }

    public UUID getModeradaPorId() {
        return moderadaPorId;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public Instant getAtualizadoEm() {
        return atualizadoEm;
    }
}
