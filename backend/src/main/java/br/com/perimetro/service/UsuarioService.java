package br.com.perimetro.service;

import br.com.perimetro.dto.AtualizarUsuarioRequestDto;
import br.com.perimetro.dto.UsuarioResponseDto;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.exception.SessaoInvalidaException;
import br.com.perimetro.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
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

    private Usuario carregar(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new SessaoInvalidaException("Sessão inválida: usuário não existe mais"));
    }
}
