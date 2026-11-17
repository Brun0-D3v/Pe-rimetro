package br.com.perimetro.service;

import br.com.perimetro.dto.LoginRequestDto;
import br.com.perimetro.dto.RegistroRequestDto;
import br.com.perimetro.dto.TokenResponseDto;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.exception.CredenciaisInvalidasException;
import br.com.perimetro.exception.EmailJaCadastradoException;
import br.com.perimetro.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AutenticacaoService {

    static final String MENSAGEM_CREDENCIAIS = "E-mail ou senha incorretos";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    // Hash fixo para gastar o mesmo tempo quando o e-mail não existe (evita revelar quais e-mails têm conta).
    private final String hashFalso;

    public AutenticacaoService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                               TokenService tokenService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.hashFalso = passwordEncoder.encode("senha-inexistente");
    }

    public static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public TokenResponseDto registrar(RegistroRequestDto dto) {
        String email = normalizarEmail(dto.getEmail());
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailJaCadastradoException("E-mail já cadastrado");
        }
        Usuario usuario = usuarioRepository.save(new Usuario(
                dto.getNome().trim(), email, passwordEncoder.encode(dto.getSenha()), Perfil.CIDADAO));
        return tokenService.gerar(usuario);
    }

    @Transactional(readOnly = true)
    public TokenResponseDto login(LoginRequestDto dto) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(normalizarEmail(dto.getEmail())).orElse(null);
        String hash = usuario != null ? usuario.getSenhaHash() : hashFalso;
        boolean senhaConfere = passwordEncoder.matches(dto.getSenha(), hash);
        if (usuario == null || !senhaConfere) {
            throw new CredenciaisInvalidasException(MENSAGEM_CREDENCIAIS);
        }
        return tokenService.gerar(usuario);
    }
}
