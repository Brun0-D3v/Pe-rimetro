package br.com.perimetro.service;

import br.com.perimetro.dto.RegiaoRequestDto;
import br.com.perimetro.dto.RegiaoResponseDto;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.repository.RegiaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RegiaoService {

    private final RegiaoRepository regiaoRepository;

    public RegiaoService(RegiaoRepository regiaoRepository) {
        this.regiaoRepository = regiaoRepository;
    }

    @Transactional(readOnly = true)
    public List<RegiaoResponseDto> listar() {
        return regiaoRepository.findAll().stream().map(this::paraDto).toList();
    }

    @Transactional(readOnly = true)
    public RegiaoResponseDto buscarPorId(UUID id) {
        return paraDto(buscarEntidadePorId(id));
    }

    @Transactional
    public RegiaoResponseDto criar(RegiaoRequestDto dto) {
        Regiao regiao = new Regiao(dto.getNome());
        return paraDto(regiaoRepository.save(regiao));
    }

    @Transactional
    public RegiaoResponseDto atualizar(UUID id, RegiaoRequestDto dto) {
        Regiao regiao = buscarEntidadePorId(id);
        regiao.setNome(dto.getNome());
        return paraDto(regiaoRepository.save(regiao));
    }

    @Transactional
    public void deletar(UUID id) {
        if (!regiaoRepository.existsById(id)) {
            throw new RegiaoNaoEncontradaException("Região não encontrada: " + id);
        }
        regiaoRepository.deleteById(id);
    }

    private Regiao buscarEntidadePorId(UUID id) {
        return regiaoRepository.findById(id)
                .orElseThrow(() -> new RegiaoNaoEncontradaException("Região não encontrada: " + id));
    }

    private RegiaoResponseDto paraDto(Regiao regiao) {
        return new RegiaoResponseDto(regiao.getId(), regiao.getNome());
    }
}
