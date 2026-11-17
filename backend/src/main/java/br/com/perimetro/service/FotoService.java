package br.com.perimetro.service;

import br.com.perimetro.dto.FotoResumoDto;
import br.com.perimetro.entity.Foto;
import br.com.perimetro.entity.Ocorrencia;
import br.com.perimetro.entity.StatusOcorrencia;
import br.com.perimetro.exception.AcessoNegadoException;
import br.com.perimetro.exception.ArquivoInvalidoException;
import br.com.perimetro.exception.ArquivoMuitoGrandeException;
import br.com.perimetro.exception.FotoNaoEncontradaException;
import br.com.perimetro.exception.LimiteFotosException;
import br.com.perimetro.exception.OcorrenciaNaoEditavelException;
import br.com.perimetro.exception.OcorrenciaNaoEncontradaException;
import br.com.perimetro.repository.FotoRepository;
import br.com.perimetro.repository.OcorrenciaRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.UUID;

@Service
public class FotoService {

    public static final long TAMANHO_MAXIMO_BYTES = 5L * 1024 * 1024;
    public static final int LIMITE_FOTOS_POR_OCORRENCIA = 3;

    /** Conteúdo de uma foto pronta para ser servida. */
    public record FotoCarregada(Resource conteudo, String tipoConteudo, boolean ocorrenciaVisivel) {
    }

    private final FotoRepository fotoRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final ArmazenamentoFoto armazenamento;

    public FotoService(FotoRepository fotoRepository, OcorrenciaRepository ocorrenciaRepository,
                       ArmazenamentoFoto armazenamento) {
        this.fotoRepository = fotoRepository;
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.armazenamento = armazenamento;
    }

    @Transactional
    public FotoResumoDto enviar(UUID ocorrenciaId, MultipartFile arquivo, UUID usuarioId, boolean admin) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(ocorrenciaId)
                .orElseThrow(() -> new OcorrenciaNaoEncontradaException("Ocorrência não encontrada: " + ocorrenciaId));
        boolean dono = usuarioId.equals(ocorrencia.getUsuarioId());
        if (!dono && !admin) {
            throw new AcessoNegadoException("Você não tem permissão para esta operação");
        }
        if (!admin && ocorrencia.getStatus() != StatusOcorrencia.VISIVEL) {
            throw new OcorrenciaNaoEditavelException("Ocorrência oculta não pode receber fotos");
        }
        if (arquivo.isEmpty()) {
            throw new ArquivoInvalidoException("O arquivo da foto está vazio");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new ArquivoMuitoGrandeException("A foto deve ter no máximo 5 MB");
        }
        if (fotoRepository.countByOcorrenciaId(ocorrenciaId) >= LIMITE_FOTOS_POR_OCORRENCIA) {
            throw new LimiteFotosException(
                    "Cada ocorrência aceita no máximo " + LIMITE_FOTOS_POR_OCORRENCIA + " fotos");
        }
        byte[] bytes;
        try {
            bytes = arquivo.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        TipoImagem tipo = TipoImagem.detectar(bytes)
                .orElseThrow(() -> new ArquivoInvalidoException("Envie uma imagem JPEG, PNG ou WebP"));
        String nome = UUID.randomUUID() + "." + tipo.extensao();
        armazenamento.salvar(nome, bytes);
        try {
            Foto foto = fotoRepository.saveAndFlush(new Foto(ocorrencia, nome, tipo.contentType(), bytes.length));
            return FotoResumoDto.de(foto);
        } catch (RuntimeException e) {
            armazenamento.remover(nome);
            throw e;
        }
    }

    /**
     * Carrega a foto. Ocorrência oculta só é revelada ao dono e ao administrador; para os demais
     * responde como se a foto não existisse.
     */
    @Transactional(readOnly = true)
    public FotoCarregada carregar(UUID fotoId, UUID usuarioIdOuNulo, boolean admin) {
        Foto foto = fotoRepository.findById(fotoId)
                .orElseThrow(() -> new FotoNaoEncontradaException("Foto não encontrada: " + fotoId));
        Ocorrencia ocorrencia = foto.getOcorrencia();
        boolean visivel = ocorrencia.getStatus() == StatusOcorrencia.VISIVEL;
        boolean dono = usuarioIdOuNulo != null && usuarioIdOuNulo.equals(ocorrencia.getUsuarioId());
        if (!visivel && !dono && !admin) {
            throw new FotoNaoEncontradaException("Foto não encontrada: " + fotoId);
        }
        Resource conteudo = armazenamento.carregar(foto.getArquivo());
        if (!conteudo.exists()) {
            throw new FotoNaoEncontradaException("Foto não encontrada: " + fotoId);
        }
        return new FotoCarregada(conteudo, foto.getTipoConteudo(), visivel);
    }

    @Transactional
    public void removerTodasDaOcorrencia(UUID ocorrenciaId) {
        List<Foto> fotos = fotoRepository.findByOcorrenciaId(ocorrenciaId);
        fotoRepository.deleteAll(fotos);
        fotos.forEach(foto -> armazenamento.remover(foto.getArquivo()));
    }
}
