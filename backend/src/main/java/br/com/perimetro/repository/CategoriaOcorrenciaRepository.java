package br.com.perimetro.repository;

import br.com.perimetro.entity.CategoriaOcorrencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CategoriaOcorrenciaRepository extends JpaRepository<CategoriaOcorrencia, UUID> {

    List<CategoriaOcorrencia> findAllByOrderByNomeAsc();
}
