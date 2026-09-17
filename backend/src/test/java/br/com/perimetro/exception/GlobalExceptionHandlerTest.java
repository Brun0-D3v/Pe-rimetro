package br.com.perimetro.exception;

import br.com.perimetro.dto.ErroResponseDto;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    @Test
    void converteExcecaoGenericaEmRespostaCincoZeroZero() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        ResponseEntity<ErroResponseDto> resposta = handler.tratarErroGenerico(new RuntimeException("falha"));

        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(resposta.getBody().getMensagem()).isEqualTo("Erro interno no servidor");
    }
}
