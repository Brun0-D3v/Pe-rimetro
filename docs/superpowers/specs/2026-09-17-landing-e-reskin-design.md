# Landing page e reskin visual do Pé-rímetro

Data: 2026-09-17
Status: aprovado para implementação (aguardando revisão final do usuário)
Repositório afetado: `frontend/` (React 19 + Vite + Tailwind CSS 4)
Documentação relacionada no Vault: ADR-009 (a criar), [[Direção Visual]], [[Identidade Visual]], [[Componentes]], [[Mapa - UX]]

## Contexto

O frontend do Pé-rímetro hoje é um SPA funcional mas com identidade visual mínima: sidebar lateral fixa, componentes de base (`Button`, `Card`, `Badge`) já tokenizados pela ADR-008, mas sem página de entrada pública e sem nenhuma linguagem de motion. O usuário forneceu como referência um componente de landing page (`PrismaHero`, React + `framer-motion`) com estética editorial escura, tipografia gigante com reveal palavra-por-palavra, navbar flutuante e microinterações.

O objetivo desta mudança é **puramente visual/estrutural de navegação** — nenhuma funcionalidade, rota de dados, hook ou service existente muda de comportamento. Duas exceções pontuais, explicitamente aprovadas pelo usuário durante o brainstorming, ampliam o escopo além de "só CSS":
1. Introdução de uma landing page pública nova em `/`.
2. Troca da navegação lateral (`Sidebar`) por uma navbar flutuante superior (`AppNavbar`), reaproveitando o mesmo padrão visual da navbar da landing.

## Decisões já tomadas (não reabrir sem nova aprovação)

- **Paleta de cores:** mantém 100% os tokens `--color-*` já `ativo` na ADR-008 (azul-marinho `primary`, base neutra escura, accent tech). Nenhuma cor nova é introduzida.
- **Tipografia:** mantém Poppins. Só a *escala* de tamanhos ganha tokens novos para os títulos editoriais grandes.
- **Mídia do hero:** gradiente/textura estática (reuso dos tokens de superfície + `noise-overlay` em CSS), sem vídeo de fundo. Sem asset de vídeo real disponível hoje.
- **Motion:** `framer-motion` é adicionado como dependência nova. Componentes de referência (`WordsPullUp`, `WordsPullUpMultiStyle`) são portados para `.jsx` puro (o projeto não usa TypeScript), como um componente único genérico `TextoRevelado`.
- **Profundidade do motion no app interno (Mapa/Avaliação/Ocorrência/Dashboard):** polimento sutil (transições de cor/estado, sem reveals de texto dramáticos). O motion "cinematográfico" completo fica restrito à landing.
- **Navegação do app interno:** `Sidebar` lateral é substituída por `AppNavbar`, pill flutuante centralizada no topo, mesmos 4 itens (Mapa, Avaliação, Ocorrência, Dashboard). Desktop mostra ícone+rótulo; mobile colapsa para só ícones (sem drawer).
- **Roteamento:** `/` passa a renderizar a `Landing` (sem `Layout`/navbar de app). O app existente passa a viver sob `/app` (`/app`, `/app/avaliacao`, `/app/ocorrencia`, `/app/dashboard`).
- **Copy da landing:** extraído das notas reais do Vault ([[Visão Geral]], [[Proposta de Solução]], [[Critérios de Avaliação]]) — nunca texto institucional inventado.
- **Acessibilidade:** todo motion respeita `prefers-reduced-motion: reduce`.

## Arquitetura de arquivos

```
frontend/src/
├── App.jsx                        # rotas atualizadas (ver seção Roteamento)
├── pages/
│   ├── Landing.jsx                 # NOVA — página institucional pública
│   ├── Mapa.jsx                    # inalterada em lógica; só recebe reskin de superfície
│   ├── Avaliacao.jsx               # idem
│   ├── Ocorrencia.jsx              # idem
│   └── Dashboard.jsx               # idem
├── components/
│   ├── landing/
│   │   ├── LandingNavbar.jsx       # NOVA — navbar flutuante da landing
│   │   ├── Hero.jsx                # NOVA — seção hero (gradiente, sem vídeo)
│   │   ├── Sobre.jsx               # NOVA — seção "Sobre o projeto"
│   │   └── ComoFunciona.jsx        # NOVA — seção das 6 dimensões
│   ├── AppNavbar.jsx               # NOVA — substitui Sidebar.jsx (removido)
│   ├── Layout.jsx                  # simplificado: sem coluna lateral, usa AppNavbar
│   └── ui/
│       ├── TextoRevelado.jsx       # NOVO — primitivo de motion (reveal palavra a palavra)
│       ├── Button.jsx              # mantido, polimento visual pontual
│       ├── Card.jsx                # mantido, polimento visual pontual
│       └── Badge.jsx               # mantido, sem alteração funcional
└── styles/
    └── index.css                   # tokens novos: escala display + motion (ver Tokens)
```

`components/Sidebar.jsx` é removido (substituído por `components/AppNavbar.jsx`). Nenhum arquivo de `hooks/`, `services/` ou `context/` é tocado.

## Roteamento (`App.jsx`)

```jsx
<Routes>
  <Route index element={<Landing />} />           {/* "/" */}
  <Route path="app" element={<Layout />}>
    <Route index element={<Mapa />} />              {/* "/app" */}
    <Route path="avaliacao" element={<Avaliacao />} />
    <Route path="ocorrencia" element={<Ocorrencia />} />
    <Route path="dashboard" element={<Dashboard />} />
  </Route>
</Routes>
```

`Landing` não usa `Layout` (sem `AppNavbar`) — tem sua própria `LandingNavbar`. O CTA da landing ("Acessar o mapa") usa `<Link to="/app">` do `react-router-dom`, nunca `<a href="#">`.

## Tokens de design (`styles/index.css`)

Adições à camada `@theme` existente (sem tocar nos tokens de cor já decididos):

```css
@theme {
  /* ...tokens de cor existentes, inalterados... */

  --text-display-lg: clamp(3rem, 18vw, 12rem);   /* título hero */
  --text-display-md: clamp(2rem, 8vw, 4.5rem);   /* títulos de seção da landing */

  --ease-reveal: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 600ms;
}
```

Uso de `clamp()` em vez dos valores fixos em `vw` da referência, para evitar título ilegível em telas muito largas ou muito estreitas (a referência original assume um contexto de landing full-bleed sem esse cuidado).

## Componentes novos — contrato

### `TextoRevelado` (`components/ui/TextoRevelado.jsx`)

Porta de `WordsPullUp`/`WordsPullUpMultiStyle` para `.jsx`, sem tipos TS, sem `useInView` de reveal contínuo — `once: true` (anima uma vez, como no original).

```jsx
<TextoRevelado texto="Pé-rímetro" className="..." />
// ou, para múltiplos estilos no mesmo bloco:
<TextoRevelado segmentos={[{ texto: "Caminhe pela ", }, { texto: "cidade", className: "text-primary-light" }]} />
```

Props: `texto` (string) OU `segmentos` (array `{texto, className?}`), `className`, `style`. Internamente usa `motion.span` com o mesmo stagger (`delay: i * 0.08`) e `--ease-reveal`. Sob `prefers-reduced-motion: reduce`, pula direto para o estado final (`opacity: 1, y: 0`) sem transição.

### `LandingNavbar` (`components/landing/LandingNavbar.jsx`)

Pill flutuante fixa no topo, 3 itens: "Sobre" (`#sobre`), "Como funciona" (`#como-funciona`), CTA "Acessar o mapa" (`<Link to="/app">`). Mesmo padrão visual (fundo escuro sólido, texto em tom claro com hover) da referência, sem os itens fictícios do Prisma.

### `Hero` (`components/landing/Hero.jsx`)

`h-screen`, fundo em gradiente (`--color-primary-surface` → `--color-base-1`) + `noise-overlay`, título "Pé-rímetro" via `TextoRevelado` em `--text-display-lg`, texto de apoio (fonte: [[Visão Geral]] — "transformar a experiência de pessoas que caminham pela cidade em dados estruturados"), CTA "Acessar o mapa" no padrão pill-com-círculo-de-seta.

### `AppNavbar` (`components/AppNavbar.jsx`)

Substitui `Sidebar`. Pill flutuante `top-center`, 4 `NavLink` (Mapa/Avaliação/Ocorrência/Dashboard, mesmos ícones `lucide-react` já usados). Desktop: ícone + rótulo. Mobile (`< md`): só ícone, gap reduzido — sem drawer, sem estado de "aberto/fechado" (o `aberta`/`aoFechar` da `Sidebar` atual deixa de existir).

### `Layout` (`components/Layout.jsx`, simplificado)

```jsx
export default function Layout() {
  return (
    <div className="min-h-screen bg-base-2">
      <AppNavbar />
      <main className="px-4 pt-24 pb-8 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
```

Sem `useState` de sidebar colapsada/menu aberto — `AppNavbar` não tem esse estado.

## Reskin dos componentes existentes

`Button`, `Card`, `Badge`: mesma API (props, variantes), só ajuste de classes Tailwind (raio, sombra, transição usando `--duration-*`/`--ease-reveal`). `Mapa.jsx`, `Avaliacao.jsx`, `Ocorrencia.jsx`, `Dashboard.jsx`: nenhuma mudança de lógica/hooks; apenas eventuais ajustes de classe para se alinharem ao novo espaçamento/tom de superfície.

## Dependências

`package.json`: adicionar `framer-motion` (`dependencies`). Nenhuma outra dependência nova. Projeto permanece em JavaScript (`.jsx`), sem introduzir TypeScript.

## Acessibilidade

Toda animação (`TextoRevelado`, transições de hover, `Hero`) respeita `prefers-reduced-motion: reduce` — via media query CSS para transições e via checagem de `window.matchMedia` (ou hook próprio) para desabilitar o stagger do `framer-motion` em `TextoRevelado`.

## Testes / verificação

Não há suíte de testes de frontend configurada hoje (apenas o backend Java tem testes). Verificação será manual:
- `npm run dev`: navegar `/` (landing) → CTA → `/app` (Mapa) → demais páginas internas.
- Redimensionar para breakpoints mobile/desktop, conferir colapso da `AppNavbar` e da `LandingNavbar`.
- Simular `prefers-reduced-motion: reduce` nas devtools e confirmar que os reveals são suprimidos.
- `npm run lint` (oxlint) sem novos warnings.
- `npm run build` concluindo sem erros.

## Fora de escopo (explicitamente)

- Autenticação/login (não existe no código ainda; landing não deve simular esse fluxo).
- Vídeo de fundo real no hero (fica para quando houver asset próprio).
- Qualquer mudança em `hooks/`, `services/`, backend, ou nas faixas numéricas do Índice de Caminhabilidade (`a_definir` em [[Classificação do Índice]]).
- Migração do projeto para TypeScript.
