package br.com.perimetro.dto;

import br.com.perimetro.entity.Foto;

import java.util.UUID;

public record FotoResumoDto(UUID id) {

    public static FotoResumoDto de(Foto foto) {
        return new FotoResumoDto(foto.getId());
    }
}
