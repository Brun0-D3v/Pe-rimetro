package br.com.perimetro.service;

import br.com.perimetro.dto.AlterarSenhaRequestDto;
import br.com.perimetro.dto.AtualizarUsuarioRequestDto;
import br.com.perimetro.dto.MinhaAvaliacaoDto;
import br.com.perimetro.dto.PaginaDto;
import br.com.perimetro.dto.ResumoAtividadeDto;
import br.com.perimetro.dto.UsuarioResponseDto;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.exception.SenhaInvalidaException;
import br.com.perimetro.exception.SessaoInvalidaException;
import br.com.perimetro.repository.AvaliacaoRepository;
import br.com.perimetro.repository.UsuarioRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UsuarioService {

    static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final UsuarioRepository usuarioRepository;
    private final AvaliacaoRepository avaliacaoRepository;

    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, AvaliacaoRepository avaliacaoRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Troca a senha exigindo a atual. Tokens já emitidos continuam valendo até expirar (decisão D11 do
     * plano da Sprint 04): invalidar na hora exigiria consultar o banco a cada requisição.
     */
    @Transactional
    public void alterarSenha(UUID id, AlterarSenhaRequestDto dto) {
        Usuario usuario = carregar(id);
        if (!passwordEncoder.matches(dto.getSenhaAtual(), usuario.getSenhaHash())) {
            throw new SenhaInvalidaException("Senha atual incorreta");
        }
        if (dto.getNovaSenha().equals(dto.getSenhaAtual())) {
            throw new SenhaInvalidaException("A nova senha deve ser diferente da atual");
        }
        usuario.alterarSenhaHash(passwordEncoder.encode(dto.getNovaSenha()));
        usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDto buscar(UUID id) {
        return UsuarioResponseDto.de(carregar(id));
    }

    /** Só o nome pode ser alterado; e-mail e perfil nunca vêm do corpo da requisição. */
    @Transactional
    public UsuarioResponseDto atualizar(UUID id, AtualizarUsuarioRequestDto dto) {
        Usuario usuario = carregar(id);
        usuario.setNome(dto.getNome().trim());
        return UsuarioResponseDto.de(usuarioRepository.save(usuario));
    }

    /** Histórico das avaliações do próprio usuário, mais recentes primeiro. */
    @Transactional(readOnly = true)
    public PaginaDto<MinhaAvaliacaoDto> minhasAvaliacoes(UUID usuarioId, int pagina, int tamanho) {
        PageRequest pedido = PageRequest.of(
                Math.max(pagina, 0),
                Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA),
                Sort.by(Sort.Direction.DESC, "criadoEm").and(Sort.by(Sort.Direction.DESC, "id")));
        return PaginaDto.de(avaliacaoRepository.findByUsuarioId(usuarioId, pedido), MinhaAvaliacaoDto::new);
    }

    @Transactional(readOnly = true)
    public ResumoAtividadeDto resumo(UUID usuarioId) {
        return new ResumoAtividadeDto(avaliacaoRepository.countByUsuarioId(usuarioId));
    }

    private Usuario carregar(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new SessaoInvalidaException("Sessão inválida: usuário não existe mais"));
    }
}
