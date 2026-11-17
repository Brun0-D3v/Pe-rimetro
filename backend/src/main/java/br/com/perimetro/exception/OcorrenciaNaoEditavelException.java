package br.com.perimetro.exception;

public class OcorrenciaNaoEditavelException extends RuntimeException {

    public OcorrenciaNaoEditavelException(String mensagem) {
        super(mensagem);
    }
}
