package br.com.perimetro.exception;

import br.com.perimetro.dto.ErroResponseDto;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RegiaoNaoEncontradaException.class)
    public ResponseEntity<ErroResponseDto> tratarRegiaoNaoEncontrada(RegiaoNaoEncontradaException excecao) {
        ErroResponseDto corpo = new ErroResponseDto(excecao.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpo);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponseDto> tratarValidacaoInvalida(MethodArgumentNotValidException excecao) {
        String mensagem = excecao.getBindingResult().getFieldErrors().stream()
                .map(erro -> erro.getField() + ": " + erro.getDefaultMessage())
                .collect(Collectors.joining("; "));
        ErroResponseDto corpo = new ErroResponseDto(mensagem, LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponseDto> tratarCorpoInvalido(HttpMessageNotReadableException excecao) {
        ErroResponseDto corpo = new ErroResponseDto("Corpo da requisição inválido", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponseDto> tratarConflitoDeIntegridade(DataIntegrityViolationException excecao) {
        ErroResponseDto corpo = new ErroResponseDto("Não é possível concluir: existem dados vinculados", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(corpo);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponseDto> tratarErroGenerico(Exception excecao) {
        ErroResponseDto corpo = new ErroResponseDto("Erro interno no servidor", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(corpo);
    }
}
