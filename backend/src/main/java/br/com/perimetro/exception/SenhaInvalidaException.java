package br.com.perimetro.exception;

/**
 * Erro de regra na troca de senha. Responde 400 (e não 401) de propósito: o frontend trata 401 fora
 * de /auth/ como sessão expirada e deslogaria a pessoa.
 */
public class SenhaInvalidaException extends RuntimeException {

    public SenhaInvalidaException(String mensagem) {
        super(mensagem);
    }
}
