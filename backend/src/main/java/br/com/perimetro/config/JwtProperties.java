package br.com.perimetro.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@ConfigurationProperties(prefix = "perimetro.jwt")
public record JwtProperties(String segredo, Duration expiracao) {

    private static final int TAMANHO_MINIMO_SEGREDO_BYTES = 32;

    public JwtProperties {
        if (segredo == null || segredo.getBytes(StandardCharsets.UTF_8).length < TAMANHO_MINIMO_SEGREDO_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET ausente ou curto demais: defina a variável de ambiente JWT_SECRET com pelo menos "
                            + TAMANHO_MINIMO_SEGREDO_BYTES + " caracteres.");
        }
        if (expiracao == null) {
            expiracao = Duration.ofHours(2);
        }
    }
}
