# Sprint 04 — Autenticação e Ocorrências — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar fase a fase. Passos usam checkbox (`- [ ]`).

**Status deste plano:** PROPOSTA — aguardando aprovação do Tech Lead. Nada abaixo foi implementado. Os itens marcados **[DECIDIR]** são decisões de produto que o Vault ainda não fechou (CLAUDE.md, REGRA 06: não inventar); cada um traz uma recomendação, mas só vira regra depois da sua confirmação e da ADR correspondente.

**Meta:** entregar cadastro/login com JWT, registro de ocorrências com categoria e foto, e moderação administrativa, conforme o nível P1 da [[Priorização MoSCoW]]; e fechar as pendências deixadas pela Sprint 03 (autor das avaliações e dos trechos, proteção de `PUT`/`DELETE`).

**Arquitetura:** Spring Security stateless com JWT assinado (HS256) validado por `oauth2-resource-server` (Nimbus, sem biblioteca JWT extra), senha com BCrypt, papéis `CIDADAO` e `ADMINISTRADOR`. Ocorrências, categorias e fotos seguem as camadas já usadas (controller → service → repository, DTOs, Flyway). Fotos em disco local, servidas por endpoint próprio. No frontend, um `AuthContext` guarda o token e o interceptor do axios o envia.

**Stack:** Spring Boot 4.1.1, Spring Security, Flyway (V5 em diante), Testcontainers; React 19, react-router 7, axios, Vitest.

**Specs (Vault):** [[Sprint 04 - Autenticação e Ocorrências]], [[Autenticação (Arquitetura)]], [[Autenticação (API)]], [[Ocorrencias]], [[Fotos]], [[Categorias]], [[Usuarios]], [[Regras de Usuário]], [[Regras de Ocorrências]], [[Status de Ocorrência]], [[ADR-011 - Avaliação Anônima até a Sprint 04]], [[ADR-013 - Usuário Cadastra Trechos pelo Mapa]].

## Restrições globais

- Português brasileiro em tudo que não é código; `data_criacao` real; nunca apagar histórico (Vault).
- Rotas sob `/api/v1` (a nota de API diz `/auth/...`; a convenção real do projeto é `/api/v1/auth/...` — atualizar a nota).
- Backend é a fonte da verdade; frontend só espelha limites.
- Testes de integração com Testcontainers (`IntegracaoBase`); TDD; um commit por tarefa.
- Segredo JWT **nunca** em arquivo versionado: variável `JWT_SECRET` (mín. 32 bytes), sem valor padrão em produção.
- Frontend: `npm run lint` sem avisos novos (3 antigos conhecidos), `npm test`, `npm run build`.

---

## O que a documentação já define e o que vamos agregar

**Já definido (vira tarefa direto):** JWT + BCrypt + Spring Security; `POST /auth/registrar`, `POST /auth/login`, `GET/PUT /usuarios/me`; `POST /trechos/{id}/ocorrencias`, `GET /ocorrencias` (admin), `PATCH /ocorrencias/{id}` (admin), `POST /ocorrencias/{id}/fotos`, `GET /categorias` (público); moderação pelo administrador (UC05); ocorrência exige categoria e permite foto.

**Agregado a partir das decisões atuais (herança das Sprints 02/03):**

1. **Autor registrado:** preencher `avaliacao.usuario_id` (ADR-011) e criar `trecho.criado_por_id` (ADR-013); dados anônimos antigos permanecem nulos.
2. **Fechar a brecha de `PUT`/`DELETE` de trecho** (risco aceito na ADR-013): só `ADMINISTRADOR`.
3. **Papéis desde já**, porque o Dashboard (Sprint 05) e a moderação dependem deles.
4. **Uma avaliação por usuário por trecho** (opcional, ver D6) — resolve o risco de distorcer o índice aceito na ADR-011.

## Decisões a confirmar [DECIDIR]

| # | Pergunta | Recomendação |
|---|---|---|
| D1 | Avaliar, criar trecho e registrar ocorrência passam a **exigir login**? | Sim para os três (a arquitetura já diz que avaliação e ocorrência exigem autenticação). Leitura (`GET`) continua pública. |
| D2 | Papéis: "Gestor" e "Administrador" são o mesmo? | Dois papéis agora: `CIDADAO` e `ADMINISTRADOR`. Gestor fica como o mesmo `ADMINISTRADOR` até a Sprint 05 provar o contrário. O admin **não** se cadastra pela API: é criado por variáveis de ambiente na subida (`ADMIN_EMAIL`/`ADMIN_SENHA`). |
| D3 | Expiração do JWT | Token de acesso de 2 h, sem refresh token (ao expirar, volta ao login). Refresh fica para depois. |
| D4 | Onde guardar o token no navegador | `localStorage` (simples; exposto a XSS). Alternativa mais segura, cookie `HttpOnly`, exige CSRF e ajustes de CORS — fora desta sprint. |
| D5 | Valores de status da ocorrência | `ABERTA` → `EM_ANALISE` → `RESOLVIDA`, e `REJEITADA` (moderação). Candidatos que o próprio [[Status de Ocorrência]] cita; **não** altera o índice do trecho. |
| D6 | Reavaliação | Uma avaliação por usuário por trecho; reenviar **substitui** a anterior e o índice é recalculado. Se preferir adiar, a Fase 5 não é executada. |
| D7 | Categorias de ocorrência | Lista inicial (seed, editável depois): Buraco na calçada, Calçada quebrada, Falta de iluminação, Falta de acessibilidade, Outro. As quatro primeiras são os exemplos que já aparecem no Vault; "Outro" é novo. |
| D8 | Fotos | Disco local (`UPLOAD_DIR`), no máx. 3 por ocorrência, 5 MB cada, JPEG/PNG/WebP validados pelo conteúdo (não pela extensão), nome gravado como UUID. Storage em nuvem fica para a publicação. |
| D9 | Foto obrigatória? | Opcional (a regra atual diz "permite anexar"). |

## Estrutura de fases

Cada fase entrega software testável sozinha e termina com commit + documentação no Vault.

| Fase | Entrega | Depende de |
|---|---|---|
| 1 | Backend de autenticação (usuário, registro, login, `/usuarios/me`, papéis, proteção de rotas, autor) | D1–D3 |
| 2 | Frontend de autenticação (login, cadastro, sessão, rota protegida, convite a entrar) | Fase 1 |
| 3 | Backend de ocorrências (categorias, ocorrência, foto, moderação) | Fase 1, D5, D7–D9 |
| 4 | Frontend de ocorrências (formulário com foto, tela de moderação do admin) | Fases 2 e 3 |
| 5 | Reavaliação (uma por usuário) — opcional | Fase 1, D6 |
| 6 | Fechamento: segurança, verificação ponta a ponta, Vault, ADRs | todas |

Recomendação de execução: **Fases 1+2 primeiro** (autenticação completa) e só depois 3+4, para revisar e testar manualmente cada metade.

---

## Fase 1 — Backend de autenticação

### Tarefa 1.1: Dependências, migration e entidade `Usuario`

**Arquivos:**
- Modificar: `backend/pom.xml` (adicionar `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`, e `spring-security-test` em escopo test)
- Criar: `backend/src/main/resources/db/migration/V5__cria_tabela_usuario.sql`
- Criar: `entity/Usuario.java`, `entity/Perfil.java` (enum `CIDADAO`, `ADMINISTRADOR`), `repository/UsuarioRepository.java`
- Teste: `repository/UsuarioRepositoryIntegracaoTest.java`

**Interfaces — produz:** `Usuario(id UUID, nome String, email String, senhaHash String, perfil Perfil, criadoEm Instant)`; `UsuarioRepository.findByEmailIgnoreCase(String): Optional<Usuario>`; `existsByEmailIgnoreCase(String): boolean`.

Migration:

```sql
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    senha_hash VARCHAR(100) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('CIDADAO', 'ADMINISTRADOR')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_usuario_email ON usuario (lower(email));
```

- [ ] Escrever o teste de integração: salvar usuário, buscar por e-mail em caixa diferente, e-mail duplicado (mesmo em maiúsculas) viola a unicidade.
- [ ] Rodar (deve falhar), implementar entidade/enum/repository/migration, rodar (deve passar).
- [ ] Commit: `feat: tabela e entidade de usuario`.

### Tarefa 1.2: Registro e login com JWT

**Arquivos:**
- Criar: `config/SegurancaConfig.java` (`SecurityFilterChain`, `PasswordEncoder` BCrypt, `JwtEncoder`/`JwtDecoder` HS256 a partir de `perimetro.jwt.segredo`), `config/JwtProperties.java` (`segredo`, `expiracao` = `PT2H`)
- Criar: `dto/RegistroRequestDto` (`nome` 2–120, `email` válido, `senha` 8–72), `dto/LoginRequestDto`, `dto/TokenResponseDto` (`token`, `tipo`="Bearer", `expiraEm`, `usuario`), `dto/UsuarioResponseDto` (`id`, `nome`, `email`, `perfil`)
- Criar: `service/AutenticacaoService.java`, `service/TokenService.java`, `controller/AutenticacaoController.java` (`POST /api/v1/auth/registrar` → 201, `POST /api/v1/auth/login` → 200)
- Criar: `exception/EmailJaCadastradoException` (409), `exception/CredenciaisInvalidasException` (401, mensagem **igual** para e-mail inexistente e senha errada)
- Modificar: `application.yml` (`perimetro.jwt.segredo: ${JWT_SECRET}`, `perimetro.jwt.expiracao: PT2H`), `exception/GlobalExceptionHandler.java`
- Teste: `service/AutenticacaoServiceTest` (unidade), `controller/AutenticacaoControllerTest`, `AutenticacaoIntegracaoTest`

**Interfaces — produz:** `TokenService.gerar(Usuario): TokenResponseDto`; claims `sub`=id do usuário, `perfil`, `exp`.

Regras a testar (cada uma um teste): registrar cria `CIDADAO` (o campo `perfil` **não** existe no DTO, então não dá para se autopromover); senha gravada é hash BCrypt, nunca igual ao texto; e-mail normalizado em minúsculas; e-mail duplicado → 409; login correto devolve token decodificável com `sub`/`perfil`; login errado → 401 com a mesma mensagem nos dois casos; senha com menos de 8 caracteres → 400; resposta nunca contém `senhaHash`.

- [ ] Escrever os testes acima (falham).
- [ ] Implementar na ordem: DTOs → exceções/handler → serviço → controller → `SegurancaConfig`.
- [ ] `SegurancaConfig` nesta tarefa libera `/api/v1/auth/**`, `/api/v1/health` e todos os `GET` de `/api/v1/**`; o resto exige token (as regras finas vêm na 1.4). `csrf` desativado (API stateless com Bearer), `SessionCreationPolicy.STATELESS`.
- [ ] Configurar `JWT_SECRET` nos testes via `application-test` ou `@DynamicPropertySource` (segredo fixo só de teste).
- [ ] Rodar a suíte inteira (86 existentes + novos). Os testes antigos que fazem `POST` anônimo vão falhar até a 1.4 — **corrigi-los nesta tarefa** autenticando via helper (ver 1.3), não afrouxando a segurança.
- [ ] Commit: `feat: registro e login com JWT`.

### Tarefa 1.3: Helper de teste, `/usuarios/me` e administrador inicial

**Arquivos:**
- Criar: `controller/UsuarioController.java` (`GET /api/v1/usuarios/me`, `PUT /api/v1/usuarios/me` altera só `nome`), `dto/AtualizarUsuarioRequestDto`
- Criar: `config/AdministradorInicial.java` (`ApplicationRunner`: se `perimetro.admin.email` e `perimetro.admin.senha` existirem e o e-mail ainda não existir, cria `ADMINISTRADOR`; se faltar variável, não faz nada e registra log informativo)
- Criar (teste): `src/test/java/.../AutenticacaoTestes.java` com `tokenDe(Perfil)` que cria o usuário direto no repositório e devolve o cabeçalho `Bearer`
- Teste: `UsuarioControllerTest`, `AdministradorInicialIntegracaoTest`

- [ ] Testes: `me` sem token → 401; com token → dados sem senha; `PUT` altera nome e ignora tentativa de mudar `perfil`/`email`; administrador inicial é criado uma vez (idempotente) e não é criado sem as variáveis.
- [ ] Implementar, rodar, commit: `feat: perfil do usuario e administrador inicial`.

### Tarefa 1.4: Proteger rotas e registrar o autor

**Arquivos:**
- Modificar: `config/SegurancaConfig.java` (regras finais abaixo)
- Criar: `V6__adiciona_autor_a_avaliacao_e_trecho.sql`
- Modificar: `entity/Avaliacao.java` (`usuarioId` ganha FK), `entity/Trecho.java` (+`criadoPorId`), `service/AvaliacaoService.java`, `service/TrechoService.java`, `dto/TrechoResponseDto` (não expor o autor: não há necessidade pública)
- Teste: `SegurancaIntegracaoTest`, ajustes em `AvaliacaoIntegracaoTest` e `TrechoIntegracaoTest`

Migration V6 (histórico anônimo permanece com `NULL`):

```sql
ALTER TABLE avaliacao
    ADD CONSTRAINT fk_avaliacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE trecho ADD COLUMN criado_por_id UUID REFERENCES usuario(id) ON DELETE SET NULL;
```

Matriz de acesso (a verificar linha a linha em `SegurancaIntegracaoTest`):

| Rota | Anônimo | Cidadão | Admin |
|---|---|---|---|
| `GET /api/v1/**` (trechos, regiões, categorias, health) | ✅ | ✅ | ✅ |
| `POST /api/v1/auth/**` | ✅ | ✅ | ✅ |
| `POST /trechos` (criar trecho) | 401 | ✅ | ✅ |
| `POST /trechos/{id}/avaliacoes` | 401 | ✅ | ✅ |
| `PUT`/`DELETE /trechos/{id}` | 401 | **403** | ✅ |
| `POST/PUT/DELETE /regioes` | 401 | **403** | ✅ |

O id do autor vem sempre do token (`Authentication.getName()` = `sub`), **nunca** do corpo da requisição.

- [ ] Escrever `SegurancaIntegracaoTest` cobrindo a matriz inteira (falha).
- [ ] Implementar regras + migration + preenchimento do autor.
- [ ] Teste: avaliação criada com token grava `usuario_id`; trecho criado grava `criado_por_id`; corpo com `usuarioId` forjado é ignorado.
- [ ] Rodar a suíte inteira. Commit: `feat: exigir login para avaliar e criar trecho; autor registrado`.

### Tarefa 1.5: Respostas de erro de segurança

**Arquivos:** `config/SegurancaConfig.java` (entry point 401 e handler 403 devolvendo `ErroResponseDto` JSON no padrão do projeto, não o HTML padrão), `Códigos HTTP` no Vault.

- [ ] Teste: 401 e 403 têm corpo JSON `{ "status": ..., "mensagem": ... }`.
- [ ] Implementar, commit: `feat: respostas JSON para 401 e 403`.

---

## Fase 2 — Frontend de autenticação

### Tarefa 2.1: Serviço, contexto e interceptor

**Arquivos:**
- Criar: `services/authService.js` (`registrar`, `login`, `buscarMe`), `context/AuthContext.jsx` (`AuthProvider`, `useAuth()` → `{ usuario, token, autenticado, ehAdmin, entrar, sair }`), `config/authConfig.js` (chave de armazenamento)
- Modificar: `services/api.js` (interceptor de requisição anexa `Authorization: Bearer`; interceptor de resposta: `401` com token presente → `sair()` e aviso "Sua sessão expirou"), `main.jsx` (envolver com `AuthProvider`)
- Teste: `context/AuthContext.test.jsx`, `services/api.test.js`

- [ ] Testes: token persiste e é restaurado ao recarregar; `sair` limpa; interceptor só anexa cabeçalho quando há token; `ehAdmin` deriva do `perfil`; token expirado/corrompido (decodificar o `exp`) é descartado na inicialização.
- [ ] Implementar, rodar, commit: `feat: contexto de autenticacao no frontend`.

### Tarefa 2.2: Telas de login e cadastro, rota protegida

**Arquivos:**
- Criar: `pages/Login.jsx`, `pages/Cadastro.jsx`, `components/RotaProtegida.jsx` (props `apenasAdmin`)
- Modificar: `App.jsx` (`/entrar`, `/cadastrar`), `components/AppNavbar.jsx` (botão "Entrar" ou menu do usuário com "Sair")
- Teste: `components/RotaProtegida.test.jsx`, testes dos formulários (validação de campos, mensagem de erro `401`/`409`)

Visual segue [[Direção Visual]] e os componentes `ui/Button`, `ui/Card` já existentes; sem biblioteca nova.

- [ ] Implementar com validação espelhando o backend (nome 2–120, e-mail, senha ≥ 8) e exibir `mensagem` do backend em erro.
- [ ] Acessibilidade: `label` em todos os campos, foco no primeiro erro, `aria-live` na mensagem.
- [ ] Commit: `feat: telas de login e cadastro`.

### Tarefa 2.3: Convite a entrar no mapa

**Arquivos:** `pages/Mapa.jsx`, `components/mapa/PainelDetalheTrecho.jsx`, `components/mapa/CabecalhoMapa.jsx`

Comportamento: sem login, "Avaliar" e "Adicionar trecho" mostram um aviso "Entre para avaliar" com link para `/entrar`, e voltam ao mapa depois do login (`?retorno=`). O mapa continua totalmente navegável sem conta.

- [ ] Testes de componente para o estado anônimo e autenticado; commit: `feat: exigir login para avaliar e adicionar trecho no mapa`.
- [ ] **Verificação manual** (Tech Lead): cadastrar, entrar, avaliar, criar trecho, sair, tentar de novo anônimo.

---

## Fase 3 — Backend de ocorrências

### Tarefa 3.1: Categorias

**Arquivos:** `V7__cria_tabela_categoria_ocorrencia.sql` (tabela + seed D7), `entity/CategoriaOcorrencia`, `repository`, `dto/CategoriaResponseDto`, `controller/CategoriaController` (`GET /api/v1/categorias`, público), testes.

- [ ] Teste de integração: a lista retorna as categorias do seed ordenadas por nome; commit.

### Tarefa 3.2: Ocorrência

**Arquivos:** `V8__cria_tabela_ocorrencia.sql`, `entity/Ocorrencia`, `entity/StatusOcorrencia` (enum D5), `repository/OcorrenciaRepository`, `dto/OcorrenciaRequestDto` (`categoriaId` obrigatório, `descricao` opcional até 500), `dto/OcorrenciaResponseDto`, `service/OcorrenciaService`, `controller/OcorrenciaController`, exceções (`CategoriaNaoEncontradaException`, `OcorrenciaNaoEncontradaException`), testes.

```sql
CREATE TABLE ocorrencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trecho_id UUID NOT NULL REFERENCES trecho(id) ON DELETE RESTRICT,
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    categoria_id UUID NOT NULL REFERENCES categoria_ocorrencia(id),
    descricao VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ABERTA'
        CHECK (status IN ('ABERTA', 'EM_ANALISE', 'RESOLVIDA', 'REJEITADA')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ocorrencia_trecho_id ON ocorrencia(trecho_id);
CREATE INDEX idx_ocorrencia_status ON ocorrencia(status);
```

Endpoints (conforme [[Ocorrencias]]): `POST /api/v1/trechos/{id}/ocorrencias` (autenticado; 201; trecho inativo → 409 como em avaliação), `GET /api/v1/ocorrencias?status=&trechoId=&pagina=&tamanho=` (admin, paginado, máx. 50 por página), `PATCH /api/v1/ocorrencias/{id}` (admin; corpo `{ "status": "..." }`).

Transições de status (D5) a testar: `ABERTA→EM_ANALISE|REJEITADA`, `EM_ANALISE→RESOLVIDA|REJEITADA`; qualquer outra → 409 com mensagem clara; `RESOLVIDA` e `REJEITADA` são finais.

- [ ] Testes (cada um separado): criar, categoria inexistente → 404, sem categoria → 400, descrição > 500 → 400, anônimo → 401, cidadão em `GET /ocorrencias` → 403, transições válidas e inválidas, paginação, ocorrência **não** altera o índice do trecho.
- [ ] Implementar e commitar.

### Tarefa 3.3: Fotos

**Arquivos:** `V9__cria_tabela_foto.sql` (`id`, `ocorrencia_id` FK `ON DELETE CASCADE`, `arquivo` nome gerado, `tipo_conteudo`, `tamanho_bytes`, `criado_em`), `entity/Foto`, `repository/FotoRepository`, `service/ArmazenamentoFotoService` (interface `salvar`/`carregar`/`remover`) + `ArmazenamentoLocal`, `service/FotoService`, `controller/FotoController` (`POST /api/v1/ocorrencias/{id}/fotos` multipart; `GET /api/v1/fotos/{id}` devolve a imagem), `config/UploadProperties` (`perimetro.upload.diretorio: ${UPLOAD_DIR:./uploads}`, tamanho máx.), `application.yml` (`spring.servlet.multipart.max-file-size: 5MB`, `max-request-size: 6MB`), `.gitignore` (`uploads/`).

Regras de segurança (cada uma um teste, [[Segurança]] pede proteção contra upload malicioso):
- só o **dono** da ocorrência (ou admin) envia foto; máximo 3 por ocorrência;
- tipo verificado pelos **bytes iniciais** (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`), ignorando `Content-Type` e extensão enviados;
- arquivo > 5 MB → 413/400 com mensagem; tipo inválido → 400;
- nome no disco é UUID + extensão derivada do tipo detectado; o nome original nunca é usado em caminho (anti *path traversal*);
- `GET /fotos/{id}` serve com `Content-Type` detectado e `X-Content-Type-Options: nosniff`; foto de ocorrência `REJEITADA` só é visível ao admin e ao dono.

- [ ] Testes com `@TempDir` como diretório de upload; arquivo disfarçado (`.png` com conteúdo de texto) é recusado.
- [ ] Implementar e commitar.

---

## Fase 4 — Frontend de ocorrências

### Tarefa 4.1: Formulário de ocorrência

**Arquivos:** `services/ocorrenciaService.js` (`listarCategorias`, `criarOcorrencia`, `enviarFoto`), `hooks/useCategorias.js`, `components/mapa/FormularioOcorrencia.jsx` (categoria, descrição com contador, até 3 fotos com pré-visualização, validação de tipo e tamanho espelhando D8), botão "Reportar problema" em `PainelDetalheTrecho.jsx`, testes.

Fluxo: cria a ocorrência, depois envia as fotos uma a uma; se uma foto falhar, a ocorrência já existe — mostrar "Ocorrência registrada, mas a foto X não foi enviada" com opção de tentar de novo (não desfazer silenciosamente).

- [ ] Em dispositivo móvel, `input type="file" accept="image/*"` permite câmera ou galeria ([[Ocorrência - UX]] deixa isso a definir — registrar a escolha).
- [ ] Atualizar `pages/Ocorrencia.jsx` (hoje placeholder) para listar "minhas ocorrências" com status (`GET /usuarios/me/ocorrencias`, **novo endpoint**, a documentar em [[Usuarios]]).
- [ ] Commit.

### Tarefa 4.2: Moderação do administrador (UC05)

**Arquivos:** `pages/Moderacao.jsx` (rota `/app/moderacao`, `RotaProtegida apenasAdmin`), `components/moderacao/ListaOcorrencias.jsx`, `DetalheOcorrencia.jsx` (foto, categoria, trecho, autor, botões de transição válidos apenas), item no menu só para admin, testes.

- [ ] Filtro por status, paginação, botões mostram só as transições permitidas pelo backend.
- [ ] **Verificação manual**: cidadão reporta com foto → admin vê, analisa e muda status → cidadão vê o novo status.

---

## Fase 5 — Reavaliação (opcional, depende de D6)

### Tarefa 5.1: Uma avaliação por usuário por trecho

**Arquivos:** `V10__unica_avaliacao_por_usuario_e_trecho.sql` (índice único parcial `WHERE usuario_id IS NOT NULL`, preserva o histórico anônimo), `AvaliacaoService` (upsert dentro da mesma transação com o `PESSIMISTIC_WRITE` já existente), `AvaliacaoResponseDto` (+ `substituida` boolean), `FormularioAvaliacao.jsx` (carrega a nota anterior quando existe — requer `GET /trechos/{id}/avaliacoes/minha`), testes.

- [ ] Testes: segunda avaliação do mesmo usuário substitui a primeira, `totalAvaliacoes` não cresce, índice recalculado; outro usuário soma normalmente; anônimas antigas intactas.

---

## Fase 6 — Fechamento

- [ ] Revisão de segurança: `JWT_SECRET` ausente derruba a aplicação na subida com mensagem clara; nenhum log contém senha/token; CORS permite o cabeçalho `Authorization`; `uploads/` fora do Git.
- [ ] Verificação ponta a ponta em ambiente descartável (banco `perimetro_verif`, portas diferentes das do Tech Lead), como nas sprints anteriores.
- [ ] Vault (um commit por assunto, seguindo o CLAUDE.md): ADR-014 (Autenticação JWT e papéis), ADR-015 (Armazenamento de fotos), ADR-016 (Status e moderação de ocorrências), e se D6 for adotada, ADR-017; atualizar [[ADR-011 - Avaliação Anônima até a Sprint 04]] e [[ADR-013 - Usuário Cadastra Trechos pelo Mapa]] (consequências cumpridas, **sem apagar** o texto antigo), [[Autenticação (API)]], [[Autenticação (Arquitetura)]], [[Segurança]], [[Regras de Usuário]], [[Regras de Ocorrências]], [[Status de Ocorrência]], [[Ocorrencias]], [[Fotos]], [[Categorias]], [[Usuarios]], [[Usuario]], [[Ocorrencia]], [[Foto]], [[CategoriaOcorrencia]], [[Modelo de Dados]], [[Diagrama ER]], [[Dicionário de Dados]], [[Scripts SQL]], [[Ocorrência - UX]], [[Casos de Uso]] (UC02/UC05), [[Sprint 04 - Autenticação e Ocorrências]] (escopo e critérios de aceitação), [[Status do Projeto]], [[Roadmap de Sprints]], [[Tarefas Concluídas]], diário do dia.
- [ ] Atualizar o README/`.env.example` do repositório de código com `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_SENHA`, `UPLOAD_DIR` (lembrando que `.env.example` está no `.gitignore` por decisão do Tech Lead — documentar as variáveis em [[Ambiente de Desenvolvimento]]).

## Riscos e fora de escopo

- **HTTPS é pré-requisito de publicação**: sem ele o token trafega em claro (já exigido pela Geolocation, [[ADR-012 - Geolocalização do Usuário no Navegador]]).
- Fora desta sprint: recuperação de senha, exclusão de conta, verificação de e-mail, refresh token, login social, limite de requisições (*rate limit*) em `/auth/login`, notificação ao autor sobre mudança de status, ocorrências visíveis no mapa para todos, moderação de trechos duplicados. Todos continuam registrados como "a definir" nas notas de regras.
- **Rate limit no login** é o item mais importante a antecipar se a aplicação for publicada antes da Sprint 06.
- Os traçados por dois endereços ([[ADR-013 - Usuário Cadastra Trechos pelo Mapa]], opção 2) seguem para depois, sem relação com esta sprint.

## Critérios de aceitação propostos (para o Tech Lead aprovar)

- Suíte do backend verde, incluindo a matriz de acesso e os testes de upload.
- Frontend: `lint` sem avisos novos, `test`, `build`.
- Verificação manual: cadastro, login, logout, expiração de sessão, avaliar e criar trecho logado, reportar ocorrência com foto, moderar como admin, cidadão bloqueado em rotas de admin.
