package br.com.perimetro.service;

import br.com.perimetro.entity.Foto;
import br.com.perimetro.repository.FotoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Esqueleto: por enquanto só remove os registros de foto. O armazenamento dos arquivos (e a remoção
 * deles do disco) é completado na tarefa seguinte.
 */
@Service
public class FotoService {

    private final FotoRepository fotoRepository;

    public FotoService(FotoRepository fotoRepository) {
        this.fotoRepository = fotoRepository;
    }

    @Transactional
    public void removerTodasDaOcorrencia(UUID ocorrenciaId) {
        List<Foto> fotos = fotoRepository.findByOcorrenciaId(ocorrenciaId);
        fotoRepository.deleteAll(fotos);
    }
}
