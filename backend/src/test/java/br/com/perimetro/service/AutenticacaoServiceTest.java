package br.com.perimetro.service;

import br.com.perimetro.dto.LoginRequestDto;
import br.com.perimetro.dto.RegistroRequestDto;
import br.com.perimetro.dto.TokenResponseDto;
import br.com.perimetro.dto.UsuarioResponseDto;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.exception.CredenciaisInvalidasException;
import br.com.perimetro.exception.EmailJaCadastradoException;
import br.com.perimetro.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AutenticacaoServiceTest {

    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final TokenService tokenService = mock(TokenService.class);
    private final AutenticacaoService service =
            new AutenticacaoService(usuarioRepository, passwordEncoder, tokenService);

    private TokenResponseDto tokenFalso() {
        return new TokenResponseDto("token", Instant.now(),
                new UsuarioResponseDto(UUID.randomUUID(), "Ana", "ana@exemplo.com", Perfil.CIDADAO));
    }

    @Test
    void registraCidadaoComSenhaEmHashEEmailNormalizado() {
        when(usuarioRepository.existsByEmailIgnoreCase("ana@exemplo.com")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocacao -> invocacao.getArgument(0));
        when(tokenService.gerar(any(Usuario.class))).thenReturn(tokenFalso());

        service.registrar(new RegistroRequestDto("  Ana  ", "  ANA@Exemplo.com ", "senha-segura"));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario salvo = captor.getValue();
        assertThat(salvo.getPerfil()).isEqualTo(Perfil.CIDADAO);
        assertThat(salvo.getEmail()).isEqualTo("ana@exemplo.com");
        assertThat(salvo.getNome()).isEqualTo("Ana");
        assertThat(salvo.getSenhaHash()).isNotEqualTo("senha-segura");
        assertThat(passwordEncoder.matches("senha-segura", salvo.getSenhaHash())).isTrue();
    }

    @Test
    void rejeitaEmailJaCadastrado() {
        when(usuarioRepository.existsByEmailIgnoreCase("ana@exemplo.com")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(new RegistroRequestDto("Ana", "ana@exemplo.com", "senha-segura")))
                .isInstanceOf(EmailJaCadastradoException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void loginComSenhaCorretaGeraToken() {
        Usuario usuario = new Usuario("Ana", "ana@exemplo.com", passwordEncoder.encode("senha-segura"), Perfil.CIDADAO);
        when(usuarioRepository.findByEmailIgnoreCase("ana@exemplo.com")).thenReturn(Optional.of(usuario));
        when(tokenService.gerar(usuario)).thenReturn(tokenFalso());

        TokenResponseDto resposta = service.login(new LoginRequestDto("ANA@exemplo.com", "senha-segura"));

        assertThat(resposta.getToken()).isEqualTo("token");
    }

    @Test
    void loginComSenhaErradaEEmailInexistenteTemAMesmaMensagem() {
        Usuario usuario = new Usuario("Ana", "ana@exemplo.com", passwordEncoder.encode("senha-segura"), Perfil.CIDADAO);
        when(usuarioRepository.findByEmailIgnoreCase("ana@exemplo.com")).thenReturn(Optional.of(usuario));
        when(usuarioRepository.findByEmailIgnoreCase("ninguem@exemplo.com")).thenReturn(Optional.empty());

        Throwable senhaErrada = org.assertj.core.api.Assertions.catchThrowable(
                () -> service.login(new LoginRequestDto("ana@exemplo.com", "errada-errada")));
        Throwable emailInexistente = org.assertj.core.api.Assertions.catchThrowable(
                () -> service.login(new LoginRequestDto("ninguem@exemplo.com", "senha-segura")));

        assertThat(senhaErrada).isInstanceOf(CredenciaisInvalidasException.class);
        assertThat(emailInexistente).isInstanceOf(CredenciaisInvalidasException.class);
        assertThat(senhaErrada.getMessage()).isEqualTo(emailInexistente.getMessage());
        verify(tokenService, never()).gerar(any());
    }
}
