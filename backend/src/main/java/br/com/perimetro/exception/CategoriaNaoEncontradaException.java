package br.com.perimetro.exception;

public class CategoriaNaoEncontradaException extends RuntimeException {

    public CategoriaNaoEncontradaException(String mensagem) {
        super(mensagem);
    }
}
