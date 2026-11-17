package br.com.perimetro.controller;

import br.com.perimetro.dto.FotoResumoDto;
import br.com.perimetro.service.FotoService;
import br.com.perimetro.service.FotoService.FotoCarregada;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class FotoController {

    private final FotoService fotoService;

    public FotoController(FotoService fotoService) {
        this.fotoService = fotoService;
    }

    @PostMapping(value = "/ocorrencias/{id}/fotos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public FotoResumoDto enviar(@PathVariable UUID id, @RequestParam("arquivo") MultipartFile arquivo,
                                @AuthenticationPrincipal Jwt jwt) {
        return fotoService.enviar(id, arquivo, UUID.fromString(jwt.getSubject()), ehAdmin(jwt));
    }

    @GetMapping("/fotos/{id}")
    public ResponseEntity<Resource> baixar(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        UUID usuarioId = jwt == null ? null : UUID.fromString(jwt.getSubject());
        FotoCarregada foto = fotoService.carregar(id, usuarioId, ehAdmin(jwt));
        CacheControl cache = foto.ocorrenciaVisivel()
                ? CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate()
                : CacheControl.noStore();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.tipoConteudo()))
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(cache)
                .body(foto.conteudo());
    }

    private static boolean ehAdmin(Jwt jwt) {
        return jwt != null && "ADMINISTRADOR".equals(jwt.getClaimAsString("perfil"));
    }
}
