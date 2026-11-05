package br.com.perimetro.controller;

import br.com.perimetro.dto.AtualizarUsuarioRequestDto;
import br.com.perimetro.dto.UsuarioResponseDto;
import br.com.perimetro.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/me")
    public UsuarioResponseDto buscarMeusDados(Authentication autenticacao) {
        return usuarioService.buscar(UUID.fromString(autenticacao.getName()));
    }

    @PutMapping("/me")
    public UsuarioResponseDto atualizarMeusDados(Authentication autenticacao,
                                                 @Valid @RequestBody AtualizarUsuarioRequestDto dto) {
        return usuarioService.atualizar(UUID.fromString(autenticacao.getName()), dto);
    }
}
