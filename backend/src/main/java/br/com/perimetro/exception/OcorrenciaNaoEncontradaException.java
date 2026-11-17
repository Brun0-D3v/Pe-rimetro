package br.com.perimetro.exception;

public class OcorrenciaNaoEncontradaException extends RuntimeException {

    public OcorrenciaNaoEncontradaException(String mensagem) {
        super(mensagem);
    }
}
