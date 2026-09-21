package br.com.perimetro.repository;

import br.com.perimetro.entity.Trecho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrechoRepository extends JpaRepository<Trecho, UUID> {

    List<Trecho> findByRegiaoId(UUID regiaoId);
}
