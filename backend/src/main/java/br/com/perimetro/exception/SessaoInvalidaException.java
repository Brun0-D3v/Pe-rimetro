package br.com.perimetro.exception;

/** O token é válido, mas o usuário dono dele não existe mais. */
public class SessaoInvalidaException extends RuntimeException {

    public SessaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
