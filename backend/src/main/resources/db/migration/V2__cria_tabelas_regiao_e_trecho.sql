CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE regiao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL
);

CREATE TABLE trecho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    geometria JSONB NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    indice_atual NUMERIC(4,2),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    regiao_id UUID NOT NULL REFERENCES regiao(id) ON DELETE RESTRICT
);

CREATE INDEX idx_trecho_regiao_id ON trecho(regiao_id);
