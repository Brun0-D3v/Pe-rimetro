package br.com.perimetro.controller;

import br.com.perimetro.dto.AlterarSenhaRequestDto;
import br.com.perimetro.dto.AtualizarUsuarioRequestDto;
import br.com.perimetro.dto.MinhaAvaliacaoDto;
import br.com.perimetro.dto.PaginaDto;
import br.com.perimetro.dto.ResumoAtividadeDto;
import br.com.perimetro.dto.UsuarioResponseDto;
import br.com.perimetro.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    private static UUID idDe(Authentication autenticacao) {
        return UUID.fromString(autenticacao.getName());
    }

    @GetMapping("/me")
    public UsuarioResponseDto buscarMeusDados(Authentication autenticacao) {
        return usuarioService.buscar(idDe(autenticacao));
    }

    @PutMapping("/me")
    public UsuarioResponseDto atualizarMeusDados(Authentication autenticacao,
                                                 @Valid @RequestBody AtualizarUsuarioRequestDto dto) {
        return usuarioService.atualizar(idDe(autenticacao), dto);
    }

    @PutMapping("/me/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alterarMinhaSenha(Authentication autenticacao, @Valid @RequestBody AlterarSenhaRequestDto dto) {
        usuarioService.alterarSenha(idDe(autenticacao), dto);
    }

    @GetMapping("/me/avaliacoes")
    public PaginaDto<MinhaAvaliacaoDto> minhasAvaliacoes(Authentication autenticacao,
                                                         @RequestParam(defaultValue = "0") int pagina,
                                                         @RequestParam(defaultValue = "20") int tamanho) {
        return usuarioService.minhasAvaliacoes(idDe(autenticacao), pagina, tamanho);
    }

    @GetMapping("/me/resumo")
    public ResumoAtividadeDto meuResumo(Authentication autenticacao) {
        return usuarioService.resumo(idDe(autenticacao));
    }
}
