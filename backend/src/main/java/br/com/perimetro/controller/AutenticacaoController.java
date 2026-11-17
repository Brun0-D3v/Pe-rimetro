package br.com.perimetro.controller;

import br.com.perimetro.dto.LoginRequestDto;
import br.com.perimetro.dto.RegistroRequestDto;
import br.com.perimetro.dto.TokenResponseDto;
import br.com.perimetro.service.AutenticacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AutenticacaoController {

    private final AutenticacaoService autenticacaoService;

    public AutenticacaoController(AutenticacaoService autenticacaoService) {
        this.autenticacaoService = autenticacaoService;
    }

    @PostMapping("/registrar")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponseDto registrar(@Valid @RequestBody RegistroRequestDto dto) {
        return autenticacaoService.registrar(dto);
    }

    @PostMapping("/login")
    public TokenResponseDto login(@Valid @RequestBody LoginRequestDto dto) {
        return autenticacaoService.login(dto);
    }
}
