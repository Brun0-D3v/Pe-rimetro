package br.com.perimetro.service;

import br.com.perimetro.config.UploadProperties;
import br.com.perimetro.exception.ArquivoInvalidoException;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

@Service
public class ArmazenamentoLocal implements ArmazenamentoFoto {

    private final Path raiz;

    public ArmazenamentoLocal(UploadProperties props) throws IOException {
        this.raiz = Path.of(props.diretorio()).toAbsolutePath().normalize();
        Files.createDirectories(raiz);
    }

    private Path resolver(String nome) {
        Path alvo = raiz.resolve(nome).normalize();
        if (!alvo.startsWith(raiz)) { // anti path traversal
            throw new ArquivoInvalidoException("Nome de arquivo inválido");
        }
        return alvo;
    }

    @Override
    public void salvar(String nome, byte[] conteudo) {
        try {
            Files.write(resolver(nome), conteudo, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public Resource carregar(String nome) {
        return new FileSystemResource(resolver(nome));
    }

    @Override
    public void remover(String nome) {
        try {
            Files.deleteIfExists(resolver(nome));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
