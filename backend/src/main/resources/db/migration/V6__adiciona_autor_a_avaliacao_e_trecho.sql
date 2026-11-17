-- Avaliações e trechos anônimos anteriores à Sprint 04 permanecem com autor nulo.
ALTER TABLE avaliacao
    ADD CONSTRAINT fk_avaliacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE trecho
    ADD COLUMN criado_por_id UUID REFERENCES usuario(id) ON DELETE SET NULL;
