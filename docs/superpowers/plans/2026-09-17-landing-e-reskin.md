# Landing Page e Reskin Visual — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma landing page pública ao frontend do Pé-rímetro e trocar a navegação lateral do app interno por uma navbar flutuante, adotando a linguagem visual de referência trazida pelo usuário (tipografia editorial grande com reveal animado, navbar flutuante), sem alterar nenhuma funcionalidade, hook, service ou rota de dados existente.

**Architecture:** `App.jsx` passa a ter duas árvores de rota: `/` renderiza a nova `Landing` (hero + seções institucionais, sem navegação de app), e `/app/*` renderiza o `Layout` existente (agora com `AppNavbar` flutuante no lugar da `Sidebar` lateral) envolvendo as 4 páginas internas já implementadas, que não mudam de lógica. Um único componente de animação genérico (`TextoRevelado`) é compartilhado entre as seções da landing.

**Tech Stack:** React 19, React Router 7, Tailwind CSS 4 (tokens via `@theme`), `framer-motion` (dependência nova), `lucide-react` (já em uso). JavaScript puro (`.jsx`), sem TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-17-landing-e-reskin-design.md`

## Global Constraints

- Nenhuma mudança em `hooks/`, `services/`, `context/`, backend, ou nas faixas numéricas do Índice de Caminhabilidade.
- Paleta de cores e tokens semânticos `--color-*` da ADR-008 permanecem intactos — nenhuma cor nova.
- Fonte permanece Poppins; nenhuma troca de família tipográfica.
- Todo motion novo (CSS ou `framer-motion`) respeita `prefers-reduced-motion: reduce`.
- Não há suíte de testes automatizados de frontend neste projeto (só o backend Java tem testes) — isso está fora de escopo desta mudança. A verificação de cada tarefa é `npm run lint` (oxlint) e `npm run build`; a verificação funcional é manual, via `npm run dev` no navegador, descrita explicitamente nos passos onde se aplica.
- Badge.jsx não é alterado (a spec marca esse componente como "sem alteração funcional").
- Todos os comandos abaixo assumem `cwd` em `C:\PROJETO PÉ-RÍMETRO\frontend`.

---

### Task 1: Dependência `framer-motion` e tokens de design (CSS)

**Files:**
- Modify: `frontend/package.json` (via `npm install`, não editar à mão)
- Modify: `frontend/src/styles/index.css:26-49`

**Interfaces:**
- Produces: tokens Tailwind `text-display-lg`, `text-display-md`, `duration-fast`, `duration-base`, `duration-slow`, `ease-reveal` (utilities geradas automaticamente pelo namespace `@theme` do Tailwind v4 a partir de `--text-*`, `--duration-*`, `--ease-*`); classe utilitária `.noise-overlay`.

- [ ] **Step 1: Instalar a dependência**

Run: `npm install framer-motion`

Expected: `framer-motion` aparece em `dependencies` no `package.json` e no `package-lock.json`, sem erros de peer dependency (React 19 é suportado pelo framer-motion atual).

- [ ] **Step 2: Adicionar os tokens novos ao `@theme` em `src/styles/index.css`**

Localizar o bloco `@theme { ... }` (linhas 27–45) e adicionar, antes do fechamento `}`:

```css
  --text-display-lg: clamp(3rem, 18vw, 12rem);
  --text-display-md: clamp(2rem, 8vw, 4.5rem);

  --ease-reveal: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 600ms;
```

- [ ] **Step 3: Adicionar a textura de ruído e a regra global de `prefers-reduced-motion`**

Depois do bloco `body { @apply bg-base-2 font-sans text-white; }` (linha 47-49), adicionar ao final do arquivo:

```css

.noise-overlay {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Verificar**

Run: `npm run build`
Expected: build termina sem erros (0 warnings novos relacionados a CSS).

Run: `npm run lint`
Expected: sem novos erros/warnings.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/styles/index.css
git commit -m "Adiciona framer-motion e tokens de tipografia display/motion"
```

---

### Task 2: Componente `TextoRevelado`

**Files:**
- Create: `frontend/src/components/ui/TextoRevelado.jsx`

**Interfaces:**
- Consumes: `framer-motion` (`motion`, `useInView`) — instalado na Task 1.
- Produces: `export default function TextoRevelado({ texto, segmentos, className, style })` — usado pelas Tasks 3 e 5 (`Hero`, `Sobre`, `ComoFunciona`). Aceita **ou** `texto` (string) **ou** `segmentos` (array de `{ texto, className? }`).

- [ ] **Step 1: Criar o componente**

```jsx
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

function prefereMovimentoReduzido() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function dividirEmPalavras(segmentos) {
  const palavras = [];
  segmentos.forEach((segmento) => {
    segmento.texto.split(" ").forEach((palavra) => {
      if (palavra) palavras.push({ palavra, className: segmento.className });
    });
  });
  return palavras;
}

export default function TextoRevelado({ texto, segmentos, className = "", style }) {
  const ref = useRef(null);
  const estaVisivel = useInView(ref, { once: true });
  const reduzirMovimento = prefereMovimentoReduzido();
  const palavras = dividirEmPalavras(segmentos ?? [{ texto }]);

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {palavras.map(({ palavra, className: classeSegmento }, indice) => (
        <motion.span
          key={`${palavra}-${indice}`}
          initial={reduzirMovimento ? false : { y: 20, opacity: 0 }}
          animate={reduzirMovimento || estaVisivel ? { y: 0, opacity: 1 } : {}}
          transition={{
            duration: 0.6,
            delay: reduzirMovimento ? 0 : indice * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`inline-block ${classeSegmento ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {palavra}
        </motion.span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build`
Expected: build sem erros (componente ainda não é importado por ninguém, mas precisa compilar isoladamente sem erro de sintaxe/import).

Run: `npm run lint`
Expected: sem erros de `react/rules-of-hooks` (o `useRef`/`useInView` são chamados incondicionalmente no topo do componente).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TextoRevelado.jsx
git commit -m "Adiciona componente TextoRevelado (reveal de texto animado)"
```

---

### Task 3: Componente `Hero`

**Files:**
- Create: `frontend/src/components/landing/Hero.jsx`

**Interfaces:**
- Consumes: `TextoRevelado` (Task 2) como `import TextoRevelado from "../ui/TextoRevelado"`; `Link` de `react-router-dom`; ícone `ArrowRight` de `lucide-react`.
- Produces: `export default function Hero()` — usado pela Task 6 (`Landing.jsx`).

- [ ] **Step 1: Criar o componente**

```jsx
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import TextoRevelado from "../ui/TextoRevelado";

export default function Hero() {
  return (
    <section className="relative flex h-screen w-full items-end overflow-hidden bg-gradient-to-b from-primary-surface to-base-1">
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />

      <div className="relative z-10 flex w-full flex-col gap-6 px-4 pb-16 sm:px-6 md:px-10 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-display-lg font-semibold leading-[0.9] tracking-tight text-white">
          <TextoRevelado texto="Pé-rímetro" />
        </h1>

        <div className="flex max-w-md flex-col gap-5 lg:pb-4">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm text-texto-mute md:text-base"
          >
            O Pé-rímetro transforma a experiência de quem caminha pela cidade
            em dados estruturados: um mapa colaborativo do índice de
            caminhabilidade urbana.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 self-start rounded-full bg-primary py-1 pl-5 pr-1 text-sm font-medium text-white transition-colors duration-base ease-reveal hover:bg-primary-hover"
            >
              Acessar o mapa
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-base-1 transition-transform duration-base ease-reveal group-hover:scale-110">
                <ArrowRight className="h-4 w-4 text-white" />
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build` e `npm run lint`
Expected: ambos sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/Hero.jsx
git commit -m "Adiciona seção Hero da landing page"
```

---

### Task 4: Componente `LandingNavbar`

**Files:**
- Create: `frontend/src/components/landing/LandingNavbar.jsx`

**Interfaces:**
- Consumes: `Link` de `react-router-dom`.
- Produces: `export default function LandingNavbar()` — usado pela Task 6 (`Landing.jsx`). Âncoras internas esperam `id="sobre"` e `id="como-funciona"`, criados na Task 5.

- [ ] **Step 1: Criar o componente**

```jsx
import { Link } from "react-router-dom";

const itens = [
  { href: "#sobre", rotulo: "Sobre" },
  { href: "#como-funciona", rotulo: "Como funciona" },
];

export default function LandingNavbar() {
  return (
    <nav className="fixed left-1/2 top-4 z-20 -translate-x-1/2">
      <div className="flex items-center gap-4 rounded-full bg-base-1 px-4 py-2 sm:gap-6 sm:px-6">
        <span className="text-sm font-semibold text-white">Pé-rímetro</span>

        {itens.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="hidden text-xs text-texto-mute transition-colors duration-base ease-reveal hover:text-white sm:inline-block sm:text-sm"
          >
            {item.rotulo}
          </a>
        ))}

        <Link
          to="/app"
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors duration-base ease-reveal hover:bg-primary-hover sm:text-sm"
        >
          Acessar o mapa
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build` e `npm run lint`
Expected: ambos sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/LandingNavbar.jsx
git commit -m "Adiciona navbar flutuante da landing page"
```

---

### Task 5: Seções `Sobre` e `ComoFunciona`

**Files:**
- Create: `frontend/src/components/landing/Sobre.jsx`
- Create: `frontend/src/components/landing/ComoFunciona.jsx`

**Interfaces:**
- Consumes: `TextoRevelado` (Task 2).
- Produces: `export default function Sobre()` e `export default function ComoFunciona()` — usados pela Task 6 (`Landing.jsx`). Renderizam `id="sobre"` e `id="como-funciona"`, alvo das âncoras da `LandingNavbar` (Task 4).

Conteúdo extraído de fontes reais do Vault (não é copy inventado): problema/solução de `01 - Visão do Projeto/Visão Geral.md`, e as 6 dimensões com pesos reais também de `Visão Geral.md` (Calçada 25%, Acessibilidade 25%, Iluminação 15%, Arborização 15%, Travessias 10%, Mobiliário 10%).

- [ ] **Step 1: Criar `Sobre.jsx`**

```jsx
import TextoRevelado from "../ui/TextoRevelado";

export default function Sobre() {
  return (
    <section id="sobre" className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h2 className="text-display-md font-semibold text-white">
        <TextoRevelado texto="Caminhabilidade, medida de verdade" />
      </h2>
      <p className="mt-6 text-base text-texto-mute md:text-lg">
        Informações sobre calçadas, obstáculos e iluminação estão dispersas e
        não são comparáveis. O Pé-rímetro reúne avaliações colaborativas de
        quem caminha pela cidade num único índice, visualizável num mapa —
        parte da ODS 11, Cidades e Comunidades Sustentáveis.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Criar `ComoFunciona.jsx`**

```jsx
import TextoRevelado from "../ui/TextoRevelado";

const dimensoes = [
  { nome: "Calçada", peso: "25%" },
  { nome: "Acessibilidade", peso: "25%" },
  { nome: "Iluminação", peso: "15%" },
  { nome: "Arborização", peso: "15%" },
  { nome: "Travessias", peso: "10%" },
  { nome: "Mobiliário", peso: "10%" },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
      <h2 className="text-center text-display-md font-semibold text-white">
        <TextoRevelado texto="Seis dimensões, um índice" />
      </h2>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {dimensoes.map((dimensao) => (
          <div
            key={dimensao.nome}
            className="rounded-2xl border border-base-4 bg-base-3 p-6 text-center"
          >
            <p className="text-2xl font-semibold text-primary-light">{dimensao.peso}</p>
            <p className="mt-2 text-sm text-texto-mute">{dimensao.nome}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npm run build` e `npm run lint`
Expected: ambos sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/Sobre.jsx src/components/landing/ComoFunciona.jsx
git commit -m "Adiciona seções Sobre e Como Funciona da landing page"
```

---

### Task 6: Página `Landing`

**Files:**
- Create: `frontend/src/pages/Landing.jsx`

**Interfaces:**
- Consumes: `LandingNavbar` (Task 4), `Hero` (Task 3), `Sobre`/`ComoFunciona` (Task 5).
- Produces: `export default function Landing()` — usado pela Task 9 (`App.jsx`).

- [ ] **Step 1: Criar a página**

```jsx
import ComoFunciona from "../components/landing/ComoFunciona";
import Hero from "../components/landing/Hero";
import LandingNavbar from "../components/landing/LandingNavbar";
import Sobre from "../components/landing/Sobre";

export default function Landing() {
  return (
    <div className="min-h-screen bg-base-1">
      <LandingNavbar />
      <Hero />
      <Sobre />
      <ComoFunciona />
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build` e `npm run lint`
Expected: ambos sem erros. A página ainda não está roteada (Task 9 faz isso) — este passo só garante que compila.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Landing.jsx
git commit -m "Adiciona página Landing compondo as seções institucionais"
```

---

### Task 7: Componente `AppNavbar`

**Files:**
- Create: `frontend/src/components/AppNavbar.jsx`

**Interfaces:**
- Consumes: `NavLink` de `react-router-dom`; ícones `AlertTriangle`, `ClipboardCheck`, `LayoutDashboard`, `Map` de `lucide-react` (mesmos já usados em `Sidebar.jsx`).
- Produces: `export default function AppNavbar()` — usado pela Task 8 (`Layout.jsx`). Assume que as rotas do app vivem sob `/app` (ver Task 9).

- [ ] **Step 1: Criar o componente**

```jsx
import { NavLink } from "react-router-dom";
import { AlertTriangle, ClipboardCheck, LayoutDashboard, Map } from "lucide-react";

const links = [
  { to: "/app", label: "Mapa", icon: Map, end: true },
  { to: "/app/avaliacao", label: "Avaliação", icon: ClipboardCheck },
  { to: "/app/ocorrencia", label: "Ocorrência", icon: AlertTriangle },
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function itemClasse({ isActive }) {
  return [
    "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-base ease-reveal",
    isActive
      ? "bg-primary-light/10 text-primary-light"
      : "text-texto-mute hover:bg-white/5 hover:text-white",
  ].join(" ");
}

export default function AppNavbar() {
  return (
    <nav className="fixed left-1/2 top-4 z-40 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-base-4 bg-primary-surface px-2 py-2 shadow-lg">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={itemClasse} title={label}>
            <Icon size={18} className="shrink-0" />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build` e `npm run lint`
Expected: ambos sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppNavbar.jsx
git commit -m "Adiciona AppNavbar flutuante para o app interno"
```

---

### Task 8: Simplificar `Layout` e remover `Sidebar`

**Files:**
- Modify: `frontend/src/components/Layout.jsx` (reescrita completa, 38 → ~12 linhas)
- Delete: `frontend/src/components/Sidebar.jsx`

**Interfaces:**
- Consumes: `AppNavbar` (Task 7).
- Produces: `export default function Layout()` sem props/estado — usado pela Task 9 (`App.jsx`), que já o usa hoje (só o conteúdo interno muda).

- [ ] **Step 1: Reescrever `Layout.jsx`**

Substituir o conteúdo inteiro de `frontend/src/components/Layout.jsx` por:

```jsx
import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-base-2">
      <AppNavbar />
      <main className="px-4 pb-8 pt-24 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
```

Isso remove o `useState` de `colapsada`/`menuAberto`, o header mobile com botão hambúrguer, e o import de `Sidebar` — nenhum desses é mais necessário sem a sidebar lateral.

- [ ] **Step 2: Remover `Sidebar.jsx`**

Run: `git rm src/components/Sidebar.jsx`

- [ ] **Step 3: Verificar**

Run: `npm run build`
Expected: build sem erros — confirma que nada mais importa `Sidebar.jsx`.

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.jsx
git commit -m "Simplifica Layout para usar AppNavbar e remove Sidebar lateral"
```

---

### Task 9: Reestruturar rotas em `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx` (arquivo inteiro, 22 linhas)

**Interfaces:**
- Consumes: `Landing` (Task 6), `Layout` (Task 8, já modificado), `Mapa`/`Avaliacao`/`Ocorrencia`/`Dashboard` (existentes, inalterados).
- Produces: rotas finais — `/` (Landing), `/app` (Mapa), `/app/avaliacao`, `/app/ocorrencia`, `/app/dashboard`.

- [ ] **Step 1: Substituir o conteúdo de `App.jsx`**

```jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Avaliacao from "./pages/Avaliacao";
import Dashboard from "./pages/Dashboard";
import Mapa from "./pages/Mapa";
import Ocorrencia from "./pages/Ocorrencia";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Landing />} />
        <Route path="app" element={<Layout />}>
          <Route index element={<Mapa />} />
          <Route path="avaliacao" element={<Avaliacao />} />
          <Route path="ocorrencia" element={<Ocorrencia />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Verificar com build e lint**

Run: `npm run build` e `npm run lint`
Expected: ambos sem erros.

- [ ] **Step 3: Verificação manual no navegador (primeira integração end-to-end)**

Run: `npm run dev`, abrir a URL indicada (padrão Vite: `http://localhost:5173`).

Checklist:
- `/` carrega a Landing: navbar flutuante no topo, hero em tela cheia com "Pé-rímetro" aparecendo com reveal animado, seções "Sobre" e "Como funciona" abaixo.
- Clicar em "Acessar o mapa" (no hero ou na navbar) leva para `/app`, que mostra a página Mapa com a `AppNavbar` flutuante no topo (não mais sidebar lateral).
- Navegar pelos 4 itens da `AppNavbar` (`/app`, `/app/avaliacao`, `/app/ocorrencia`, `/app/dashboard`) — todas as páginas carregam normalmente, com o mesmo conteúdo de antes (só o shell visual mudou).
- Redimensionar a janela para largura mobile (< 768px): `AppNavbar` mostra só ícones (sem rótulo), `LandingNavbar` esconde "Sobre"/"Como funciona" mantendo logo + CTA.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "Reestrutura rotas: / vira Landing, app interno passa a viver em /app"
```

---

### Task 10: Reskin pontual de `Button` e `Card`

**Files:**
- Modify: `frontend/src/components/ui/Button.jsx:1-18` (arquivo inteiro, sem mudança de props/API)
- Modify: `frontend/src/components/ui/Card.jsx:1-8` (arquivo inteiro, sem mudança de props/API)

**Interfaces:**
- Nenhuma mudança de assinatura — `Button` continua aceitando `variante`, `className`, `...props`; `Card` continua aceitando `children`, `className`. Páginas que já usam esses componentes (`Mapa`, `Avaliacao`, `Ocorrencia`, `Dashboard`) não precisam de nenhuma alteração.

- [ ] **Step 1: Atualizar `Button.jsx`**

```jsx
const variantes = {
  primario: "bg-primary text-white hover:bg-primary-hover",
  secundario: "border border-base-4 text-white hover:bg-white/5",
  fantasma: "text-texto-mute hover:bg-white/5 hover:text-white",
};

export default function Button({ variante = "primario", className = "", ...props }) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-base ease-reveal disabled:cursor-not-allowed disabled:opacity-50",
        variantes[variante],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Atualizar `Card.jsx`**

```jsx
export default function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-base-4 bg-base-3 p-8 shadow-sm transition-colors duration-base ease-reveal",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npm run build` e `npm run lint`
Expected: ambos sem erros.

Run: `npm run dev`, abrir `/app` e as demais páginas internas.
Expected: os `Card`s das 4 páginas continuam com a mesma aparência estrutural (borda, fundo, raio), só com uma transição de cor mais deliberada perceptível ao interagir (ex.: nenhuma quebra visual).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Button.jsx src/components/ui/Card.jsx
git commit -m "Aplica tokens de motion no Button e Card"
```

---

### Task 11: Verificação final e checklist de aceitação

**Files:** nenhum arquivo novo — esta tarefa só verifica o resultado das Tasks 1–10.

- [ ] **Step 1: Build e lint limpos**

Run: `npm run build`
Expected: build de produção conclui sem erros nem warnings novos.

Run: `npm run lint`
Expected: sem erros/warnings novos além dos pré-existentes (se houver).

- [ ] **Step 2: Checklist manual completo (`npm run dev`)**

- [ ] `/` — Landing carrega, hero em tela cheia, título "Pé-rímetro" com reveal palavra a palavra, texto de apoio e CTA aparecem com fade/slide-up.
- [ ] Scroll até `#sobre` e `#como-funciona` funciona via clique nos links da `LandingNavbar` (desktop, ≥ 640px).
- [ ] `/app`, `/app/avaliacao`, `/app/ocorrencia`, `/app/dashboard` carregam com o mesmo conteúdo de antes, agora com `AppNavbar` flutuante no topo em vez de sidebar lateral.
- [ ] Em largura mobile (< 768px): `AppNavbar` mostra só ícones; `LandingNavbar` esconde os links de texto, mantendo logo e CTA "Acessar o mapa".
- [ ] Nas DevTools, emular `prefers-reduced-motion: reduce` (Chrome: Rendering tab → Emulate CSS media feature) e recarregar `/`: o reveal de texto do hero aparece direto, sem animação de entrada perceptível.
- [ ] Nenhuma URL antiga (`/avaliacao`, `/ocorrencia`, `/dashboard` sem o prefixo `/app`) é referenciada em nenhum lugar do código — checar com busca por essas strings em `src/`.

- [ ] **Step 3: Checar que nenhuma rota antiga ficou referenciada**

Run (na raiz de `frontend/`): `grep -rn "to=\"/avaliacao\"\|to=\"/ocorrencia\"\|to=\"/dashboard\"" src/`
Expected: nenhum resultado (todas as referências já usam o prefixo `/app`).

- [ ] **Step 4: Commit final (se houver ajustes desta verificação)**

Se a Step 2 ou 3 revelar algum ajuste necessário, corrigir, repetir Step 1, e:

```bash
git add -A
git commit -m "Ajustes finais de verificação do reskin e da landing page"
```

Se nada precisar de ajuste, esta task não gera commit — as Tasks 1–10 já cobrem toda a mudança.
