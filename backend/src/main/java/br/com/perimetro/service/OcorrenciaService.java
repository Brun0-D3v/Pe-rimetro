package br.com.perimetro.service;

import br.com.perimetro.dto.ContagemOcorrenciaDto;
import br.com.perimetro.dto.OcorrenciaRequestDto;
import br.com.perimetro.dto.OcorrenciaResponseDto;
import br.com.perimetro.dto.PaginaDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.CategoriaOcorrencia;
import br.com.perimetro.entity.Foto;
import br.com.perimetro.entity.Ocorrencia;
import br.com.perimetro.entity.StatusOcorrencia;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.exception.AcessoNegadoException;
import br.com.perimetro.exception.CategoriaNaoEncontradaException;
import br.com.perimetro.exception.OcorrenciaNaoEditavelException;
import br.com.perimetro.exception.OcorrenciaNaoEncontradaException;
import br.com.perimetro.exception.SessaoInvalidaException;
import br.com.perimetro.exception.TrechoInativoException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.CategoriaOcorrenciaRepository;
import br.com.perimetro.repository.FotoRepository;
import br.com.perimetro.repository.OcorrenciaRepository;
import br.com.perimetro.repository.TrechoRepository;
import br.com.perimetro.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OcorrenciaService {

    static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final OcorrenciaRepository ocorrenciaRepository;
    private final FotoRepository fotoRepository;
    private final TrechoRepository trechoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaOcorrenciaRepository categoriaRepository;
    private final FotoService fotoService;

    public OcorrenciaService(OcorrenciaRepository ocorrenciaRepository, FotoRepository fotoRepository,
                             TrechoRepository trechoRepository, UsuarioRepository usuarioRepository,
                             CategoriaOcorrenciaRepository categoriaRepository, FotoService fotoService) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.fotoRepository = fotoRepository;
        this.trechoRepository = trechoRepository;
        this.usuarioRepository = usuarioRepository;
        this.categoriaRepository = categoriaRepository;
        this.fotoService = fotoService;
    }

    @Transactional
    public OcorrenciaResponseDto criar(UUID trechoId, OcorrenciaRequestDto dto, UUID usuarioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new SessaoInvalidaException("Sessão inválida: usuário não existe mais");
        }
        Trecho trecho = trechoRepository.findById(trechoId)
                .orElseThrow(() -> new TrechoNaoEncontradoException("Trecho não encontrado: " + trechoId));
        if (trecho.getStatus() == AtivoInativo.INATIVO) {
            throw new TrechoInativoException("Trecho inativo não recebe ocorrências: " + trechoId);
        }
        CategoriaOcorrencia categoria = carregarCategoria(dto.getCategoriaId());
        Ocorrencia salva = ocorrenciaRepository.save(
                new Ocorrencia(trecho, categoria, normalizar(dto.getDescricao()), usuarioId));
        return OcorrenciaResponseDto.de(salva, List.of(), null);
    }

    /** Lista pública: só ocorrências visíveis, mais recentes primeiro, sem identificar o autor. */
    @Transactional(readOnly = true)
    public PaginaDto<OcorrenciaResponseDto> listarPublicasDoTrecho(UUID trechoId, int pagina, int tamanho) {
        Page<Ocorrencia> pag = ocorrenciaRepository.findByTrechoIdAndStatus(
                trechoId, StatusOcorrencia.VISIVEL, pedido(pagina, tamanho));
        return montar(pag, Map.of());
    }

    @Transactional(readOnly = true)
    public List<ContagemOcorrenciaDto> contagemPorTrecho() {
        return ocorrenciaRepository.contarVisiveisPorTrecho().stream()
                .map(c -> new ContagemOcorrenciaDto(c.getTrechoId(), c.getTotal()))
                .toList();
    }

    /** Visão da moderação: inclui ocultas e o nome do autor. */
    @Transactional(readOnly = true)
    public PaginaDto<OcorrenciaResponseDto> listarParaModeracao(StatusOcorrencia status, boolean moderadasPorMim,
                                                               UUID adminId, int pagina, int tamanho) {
        Page<Ocorrencia> pag = ocorrenciaRepository.buscarParaModeracao(
                status, moderadasPorMim ? adminId : null, pedido(pagina, tamanho));
        Set<UUID> autores = pag.getContent().stream()
                .map(Ocorrencia::getUsuarioId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<UUID, String> nomes = new HashMap<>();
        for (Usuario usuario : usuarioRepository.findAllById(autores)) {
            nomes.put(usuario.getId(), usuario.getNome());
        }
        return montar(pag, nomes);
    }

    @Transactional(readOnly = true)
    public PaginaDto<OcorrenciaResponseDto> minhas(UUID usuarioId, StatusOcorrencia status, int pagina, int tamanho) {
        Page<Ocorrencia> pag = status == null
                ? ocorrenciaRepository.findByUsuarioId(usuarioId, pedido(pagina, tamanho))
                : ocorrenciaRepository.findByUsuarioIdAndStatus(usuarioId, status, pedido(pagina, tamanho));
        return montar(pag, Map.of());
    }

    @Transactional
    public OcorrenciaResponseDto alterarStatus(UUID id, StatusOcorrencia novo, UUID adminId) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id)
                .orElseThrow(() -> new OcorrenciaNaoEncontradaException("Ocorrência não encontrada: " + id));
        Ocorrencia salva = ocorrencia;
        if (ocorrencia.getStatus() != novo) {
            ocorrencia.definirStatus(novo, adminId);
            salva = ocorrenciaRepository.save(ocorrencia);
        }
        return OcorrenciaResponseDto.de(salva, fotoRepository.findByOcorrenciaId(id), nomeDoAutor(salva));
    }

    @Transactional
    public OcorrenciaResponseDto editar(UUID id, OcorrenciaRequestDto dto, UUID usuarioId) {
        Ocorrencia ocorrencia = carregarDoDono(id, usuarioId);
        ocorrencia.editar(carregarCategoria(dto.getCategoriaId()), normalizar(dto.getDescricao()));
        Ocorrencia salva = ocorrenciaRepository.save(ocorrencia);
        return OcorrenciaResponseDto.de(salva, fotoRepository.findByOcorrenciaId(id), null);
    }

    @Transactional
    public void excluir(UUID id, UUID usuarioId) {
        Ocorrencia ocorrencia = carregarDoDono(id, usuarioId);
        fotoService.removerTodasDaOcorrencia(id);
        ocorrenciaRepository.delete(ocorrencia);
    }

    private Ocorrencia carregarDoDono(UUID id, UUID usuarioId) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id)
                .orElseThrow(() -> new OcorrenciaNaoEncontradaException("Ocorrência não encontrada: " + id));
        if (!usuarioId.equals(ocorrencia.getUsuarioId())) {
            throw new AcessoNegadoException("Apenas o autor pode alterar a ocorrência");
        }
        if (ocorrencia.getStatus() == StatusOcorrencia.OCULTA) {
            throw new OcorrenciaNaoEditavelException("Ocorrência oculta pela moderação não pode ser alterada");
        }
        return ocorrencia;
    }

    private CategoriaOcorrencia carregarCategoria(UUID categoriaId) {
        return categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new CategoriaNaoEncontradaException("Categoria não encontrada: " + categoriaId));
    }

    private String nomeDoAutor(Ocorrencia ocorrencia) {
        if (ocorrencia.getUsuarioId() == null) {
            return null;
        }
        return usuarioRepository.findById(ocorrencia.getUsuarioId()).map(Usuario::getNome).orElse(null);
    }

    private PaginaDto<OcorrenciaResponseDto> montar(Page<Ocorrencia> pag, Map<UUID, String> nomesPorUsuario) {
        List<UUID> ids = pag.getContent().stream().map(Ocorrencia::getId).toList();
        Map<UUID, List<Foto>> fotosPorOcorrencia = ids.isEmpty()
                ? Map.of()
                : fotoRepository.findByOcorrenciaIdIn(ids).stream()
                        .collect(Collectors.groupingBy(f -> f.getOcorrencia().getId()));
        return PaginaDto.de(pag, o -> OcorrenciaResponseDto.de(
                o,
                fotosPorOcorrencia.getOrDefault(o.getId(), List.of()),
                o.getUsuarioId() == null ? null : nomesPorUsuario.get(o.getUsuarioId())));
    }

    private static PageRequest pedido(int pagina, int tamanho) {
        return PageRequest.of(
                Math.max(pagina, 0),
                Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA),
                Sort.by(Sort.Direction.DESC, "criadoEm").and(Sort.by(Sort.Direction.DESC, "id")));
    }

    private static String normalizar(String descricao) {
        if (descricao == null) {
            return null;
        }
        String limpa = descricao.trim();
        return limpa.isEmpty() ? null : limpa;
    }
}
