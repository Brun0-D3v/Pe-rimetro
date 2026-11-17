-- V7__cria_tabela_categoria_ocorrencia.sql
CREATE TABLE categoria_ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(80) NOT NULL UNIQUE
);

INSERT INTO categoria_ocorrencia (nome) VALUES
    ('Buraco na calçada'),
    ('Calçada quebrada'),
    ('Falta de iluminação'),
    ('Falta de acessibilidade'),
    ('Outro');
