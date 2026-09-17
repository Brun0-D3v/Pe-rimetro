package br.com.perimetro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_health")
public class SystemHealth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "verificado_em", nullable = false)
    private LocalDateTime verificadoEm;

    protected SystemHealth() {
    }

    public SystemHealth(LocalDateTime verificadoEm) {
        this.verificadoEm = verificadoEm;
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getVerificadoEm() {
        return verificadoEm;
    }
}
