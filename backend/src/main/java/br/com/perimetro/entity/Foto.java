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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "foto")
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocorrencia_id", nullable = false)
    private Ocorrencia ocorrencia;

    @Column(nullable = false, length = 80, unique = true)
    private String arquivo;

    @Column(name = "tipo_conteudo", nullable = false, length = 30)
    private String tipoConteudo;

    @Column(name = "tamanho_bytes", nullable = false)
    private long tamanhoBytes;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected Foto() {
    }

    public Foto(Ocorrencia ocorrencia, String arquivo, String tipoConteudo, long tamanhoBytes) {
        this.ocorrencia = ocorrencia;
        this.arquivo = arquivo;
        this.tipoConteudo = tipoConteudo;
        this.tamanhoBytes = tamanhoBytes;
        this.criadoEm = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Ocorrencia getOcorrencia() {
        return ocorrencia;
    }

    public String getArquivo() {
        return arquivo;
    }

    public String getTipoConteudo() {
        return tipoConteudo;
    }

    public long getTamanhoBytes() {
        return tamanhoBytes;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }
}
