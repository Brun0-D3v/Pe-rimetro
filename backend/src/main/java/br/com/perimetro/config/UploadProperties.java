package br.com.perimetro.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "perimetro.upload")
public record UploadProperties(String diretorio) {
}
