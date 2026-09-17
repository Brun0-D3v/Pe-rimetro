package br.com.perimetro.dto;

import java.time.LocalDateTime;

public class ErroResponseDto {

    private final String mensagem;
    private final LocalDateTime ocorridoEm;

    public ErroResponseDto(String mensagem, LocalDateTime ocorridoEm) {
        this.mensagem = mensagem;
        this.ocorridoEm = ocorridoEm;
    }

    public String getMensagem() {
        return mensagem;
    }

    public LocalDateTime getOcorridoEm() {
        return ocorridoEm;
    }
}
