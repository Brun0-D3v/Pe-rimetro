package br.com.perimetro.exception;

public class FotoNaoEncontradaException extends RuntimeException {

    public FotoNaoEncontradaException(String mensagem) {
        super(mensagem);
    }
}
