package br.com.perimetro.service;

import org.springframework.core.io.Resource;

public interface ArmazenamentoFoto {

    void salvar(String nome, byte[] conteudo);

    Resource carregar(String nome);

    void remover(String nome);
}
