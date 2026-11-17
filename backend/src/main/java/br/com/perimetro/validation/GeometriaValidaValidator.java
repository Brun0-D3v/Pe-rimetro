package br.com.perimetro.validation;

import br.com.perimetro.dto.PontoDto;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.List;

public class GeometriaValidaValidator implements ConstraintValidator<GeometriaValida, List<PontoDto>> {

    @Override
    public boolean isValid(List<PontoDto> geometria, ConstraintValidatorContext contexto) {
        if (geometria == null) {
            return true; // a ausência já é barrada por @NotNull no DTO
        }
        String motivo = GeometriaTrecho.motivoDaInvalidez(geometria);
        if (motivo == null) {
            return true;
        }
        contexto.disableDefaultConstraintViolation();
        contexto.buildConstraintViolationWithTemplate(motivo).addConstraintViolation();
        return false;
    }
}
