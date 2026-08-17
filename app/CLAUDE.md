# CertifiqueAI — Frontend Context

Guia de referência para padronização de páginas e componentes. Todas as decisões visuais estão aqui.

---

## Design System — Navy + Amber-Orange

**Flat design**: superfícies sólidas, bordas simples, sem gradientes, sem blur, sem glassmorphism.

### Paleta de cores

| Token | Dark | Light |
|---|---|---|
| `background` | `#09112a` | `#f8fafc` |
| `background2` | `#070e20` | `#eef2f6` |
| `content1` (surface) | `#0c1832` | `#ffffff` |
| `content2` | `#10203c` | `#f1f5f9` |
| `primary` | `#e07820` (Amber) | `#4f46e5` (Indigo) |
| `danger` | `#e05252` | `#e05252` |
| `success` | `#3db87a` | `#3db87a` |
| `warning` | `#d4a012` | `#d4a012` |

### Tokens semânticos (nunca cores hard-coded)

```
bg-background / bg-background2 / bg-content1 / bg-content2
text-foreground / text-default-500 / text-default-400 / text-primary
border-divider / border-default-200
```

**Gotcha:** `bg-default-100` não é superfície — use `bg-content2`. Só aparece em `hover:bg-default-100` interno do HeroUI.

### Fundos de página

- Páginas autenticadas com `PageHeader`: classe `.app-bg`
- `/dashboard`: `bg-background` diretamente
- Auth pages: `AuthSplitLayout` (`app/(auth)/components/AuthSplitLayout.tsx`)

### Custom CSS classes (`styles/globals.css`)

`.app-bg` (min-height), `.page-header-title` (2rem/800), `.page-header-subtitle` (0.9rem)

---

## Tipografia

**Fontes:** Inter (`--font-sans`) — UI/workspace. Sora (`font-sora`) — logotipo, `<h1>`/`<h2>` em surfaces de marketing e landing. Fira Code (`--font-mono`) — labels de seção, contadores.

Hierarquia: `.page-header-title` → `text-3xl font-extrabold` → `text-xl font-bold` → `text-xs font-semibold text-primary` (label de seção) → `text-sm text-default-500` (corpo).

**Proibido em títulos e corpo:** `uppercase`, `tracking-widest`, `tracking-[0.2em]`, `tracking-[0.05em]`.

**Exceção (section kicker label):** `font-mono text-xs text-default-400 uppercase tracking-widest` — válido para separadores de nav e cabeçalhos de grupo.

---

## Padrão de botões

Todos os classNames via `buttonStyles` de `config/constants/buttonStyles.ts` — nunca inline.

Variantes: `primary`, `secondary` (`variant="bordered"`), `flat`, `primarySm`, `danger`, `dangerFlat`, `iconOnly.neutral/primary/danger`.

**Regras obrigatórias:**
- Nunca use `color=` em `<Button>` — coloração via `className={buttonStyles.*}` apenas
- Variants aprovadas: `bordered` (secondary), `light` (icon-only), ou ausente
- Nunca `variant="ghost"`, `"solid"`, `"shadow"`, nem `"light"` em botões com texto
- Icon-only: `isIconOnly` + `size="sm"` + `aria-label` obrigatório
- `<span role="button">` é proibido — use sempre `<Button>` do HeroUI

---

## Padrão de cards

```tsx
<div className="bg-content1 border border-default-200 rounded-xl p-6">
```

---

## Padrão de chips

Sempre `size="sm"`. Coloração via `color=` — nunca via `className`.

Score helper: `≥70 → 'success'`, `≥50 → 'warning'`, `else → 'danger'`.

**Proibido:** omitir `size`, usar `md/lg`, sobrepor tamanho via `className`.

---

## Padrão de inputs

Spread de `inputProperties` de `config/constants/inputStyles.ts` — nunca repita `variant`/`classNames` manualmente.

Variantes do objeto: `inputProperties.input`, `.select`, `.autocomplete`.

**Gotcha crítico:** `labelPlacement: 'outside'` requer `placeholder` — sem ele o label flutua para dentro do campo. Use `placeholder=" "` como fallback mínimo.

**Gotcha `<Select>` + `description`:** não passe `description` num `Select` com `labelPlacement: 'outside'`. O helper liga `data-has-helper` no wrapper, que aplica `group-data-[has-helper=true]:-translate-y-0` e `:relative` no label — o deslocamento é cancelado e o label cai **em cima** do campo. Não quebra tsc nem build, só aparece na tela. Renderize a dica como `<p className="text-xs text-default-500">` irmã do `Select`. Vale só para `Select`; em `Input` o `description` funciona.

**Senha:** sempre `<PasswordInput>` (toggle incluso), nunca `<Input type="password">`.

---

## Layout de páginas

Use `<PageHeader>` de `shared/components/ui/PageHeader.tsx` — inclui `.app-bg`, container e espaçamentos. Aceita `maxWidth?: '4xl' | '7xl'` (default `'7xl'`).

**Tabs classNames:**
```tsx
{ tabList: 'bg-content2 border border-default-200 rounded-xl p-1 gap-1',
  tab: 'text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold',
  cursor: 'bg-primary rounded-xl' }
```

**Accordion itemClasses:**
```tsx
{ base: 'bg-content1 border border-default-200 rounded-xl',
  title: 'text-sm font-bold text-foreground',
  trigger: 'px-6 py-4 hover:bg-content2 transition-colors duration-200',
  content: 'px-6 pb-6', indicator: 'text-default-400' }
```

---

## Empty states — dois tiers

Nunca markup inline. Escolha o tier pelo contexto:

### `EmptyState` (`shared/components/ui/EmptyState.tsx`)

Compacto, sem ícone. Para feedback contextual dentro de widgets, seções de formulário ou resultados de filtro.

API: `title` (obrigatório), `description?`, `action?: { label, href?, onPress?, icon? }`.

Exemplos de uso: seções do dashboard (`ScoreTrendSection`, `DomainBreakdownSection`), `NewMockExamForm`, `question-bank` para erro de carga e "nenhum resultado para estes filtros".

### `IllustratedEmptyState` (`shared/components/ui/IllustratedEmptyState.tsx`)

Grande, com círculo de ícone e borda dashed. Para o estado primário de uma lista ou página — o usuário ainda não tem nenhum dado e precisa ser guiado ao primeiro CTA.

API: `icon: IconDefinition` (obrigatório), `title`, `description`, `action?: { label, href?, onPress? }`.

Exemplos de uso: lista de exames, lista de simulados, banco de questões vazio, histórico de gerações vazio, geração de questões sem exames cadastrados.

**Regra de decisão:** se o empty state está dentro de um card ou widget pequeno → `EmptyState`. Se ocupa uma seção inteira ou é o único conteúdo visível na página → `IllustratedEmptyState`.

Copy via `t()` sempre. Descrição deve dizer o que fazer a seguir, não repetir o título.

---

## Banco de Questões (`app/(workspace)/question-bank/`)

```
app/(workspace)/question-bank/
  page.tsx
  components/QuestionBankCard.tsx
  components/QuestionBankFiltersBar.tsx
app/api/question-bank/route.ts / topics/route.ts / sources/route.ts
features/services/question-bank.service.ts
```

Filtros: `search` (deferido), `source` (multi), `type`, `topic` (multi), `difficulty` (multi), `hasAnswer+hasExplanation`.

**Gotcha arrays:** `lib/bff.api.ts` usa `paramsSerializer: { indexes: null }` — arrays chegam sem colchetes (`difficulty=easy&difficulty=hard`). Route handler lê com `searchParams.getAll('difficulty')`. Não remover o paramsSerializer.

**Delete de questões:** SQLite não tem `onDelete: Cascade` em `Option/Answer/Explanation`. `BrowseQuestionsService.deleteQuestion` deleta na ordem: `explanation → answer → option → question`. Mesmo padrão para `PublicExam*`.

---

## Estrutura de páginas e componentes

### Arquitetura de layouts

| Group | Chrome | Rotas |
|---|---|---|
| `(marketing)` | `layout.tsx` fino: `.marketing-ds` + fontes Barlow + JSON-LD (sem navbar/footer) | contém os sub-grupos `(site)` e `(focused-cta)` |
| `(marketing)/(site)` | `MarketingNavbar` + `MarketingFooter` | `/`, `/pricing`, `/privacy`, `/terms`, `/security`, `/lgpd` |
| `(marketing)/(focused-cta)` | `FocusedCtaNavbar` minimal + mesmo `MarketingFooter` | `/simulado/[exam-slug]` |
| `(workspace)` | Sidebar + WorkspaceHeader + AiChatWrapper | `/dashboard`, `/exams`, `/questions`, `/simulados`, `/question-bank`, `/billing` |
| `(auth)` | Top bar discreta | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| `admin/` | Sidebar admin própria | `/admin/*` |

**Gotcha layout workspace:** `min-w-0` na coluna de conteúdo é obrigatório — sem ele tabelas e accordions sangram para fora do flex container.

### Sidebar

Três regiões: desktop (`w-64 sticky`), mobile top bar (hamburger), mobile drawer. Rodapé com contadores de uso via `useUsageContext()`. User dropdown, theme/language switch, sign out ficam no `WorkspaceHeader`, não no sidebar.

### Domínio: Exams (`/exams?type=certification|public_exam`)

| Arquivo | Papel |
|---|---|
| `exam-config.ts` | `EXAM_CONFIG[type]` — todas as diferenças de domínio |
| `components/list/ExamCard.tsx` | Card com logo/initials/icon, stats, `footerAction?` |
| `components/list/ExamDetailPanel.tsx` | Painel com `ExamSectionsTable` |
| `components/list/ExamsList.tsx` | Lista + skeleton + empty state + detail panel animado |
| `components/wizard/` | Wizard 3 passos: BasicInfo, DefineSections, Review |
| `components/catalog/CatalogSection.tsx` | Catálogo de templates — filtra por type, inscrição via `addExam` no contexto |

Importar config via `@/app/(workspace)/exams/exam-config` (nunca relativo).

### Domínio: Simulados (`/simulados`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Monta 4 providers: `CertificationsProvider`, `PublicExamsProvider`, `CertSimuladosProvider`, `MockExamsProvider` |
| `SimuladosListTab.tsx` | Lista unificada, status chips, delete, histórico de tentativas |
| `NewSimuladoTab.tsx` | Type picker (cert/concurso) |
| `NewCertSimuladoForm.tsx` | Form cert simulado com distribuição por tópico |
| `NewMockExamForm.tsx` | Form mock exam com distribuição por matéria |

Status chip map: `pending → default`, `in_progress → warning`, `answered → success`.

---

## Componentes compartilhados (`shared/components/ui/`)

| Componente | Papel |
|---|---|
| `PageHeader.tsx` | Wrapper de página autenticada |
| `sidebar.tsx` / `workspace-header.tsx` | App shell |
| `EmptyState.tsx` | Estado vazio padronizado |
| `SkeletonListLoader.tsx` | Skeleton durante fetch de provider |
| `BusyDialog.tsx` | Modal de loading em operações longas |
| `PasswordInput.tsx` | Input senha com toggle, spread de `inputProperties.input` |
| `RelativeDate.tsx` | Data relativa (`Intl.RelativeTimeFormat`) com `suppressHydrationWarning` |
| `UsageBadge.tsx` | Barra de uso — se oculta quando `questionsLimit === -1` |
| `AiChatWrapper.tsx` | FAB + Drawer — visível apenas para `pro_ai`, `tester`, `admin` |

Domínio compartilhado: `CertificationManager`, `PublicExamManager`, `SectionsTable`, `PublicExamSubjectsTable`, `QuestionCard`, `AnsweredQuestionCard`.

---

## Hooks

| Hook | Resumo |
|---|---|
| `useRequest` | HTTP wrapper com loading + toast de erro automático |
| `useTranslation` | `{ t, language, setLanguage }` |
| `useUsageContext` | `{ usage, refreshUsage }` — chame `refreshUsage()` após salvar questões |
| `useExamsContext` | Estado do `ExamsProvider` — `addExam`, `removeExam`, `updateExam`, etc. |
| `useCertificationsContext` / `usePublicExamsContext` / `useQuizContext` / `useMockExamsContext` | Contextos de domínio |
| `useInactivityLogout` | Auto-logout por inatividade — via `<InactivityGuard />` em `providers.tsx` |
| `useAiChat(userId)` | Chat com histórico isolado por `userId` em localStorage |

**`useRequest` vs try/catch manual:** use `useRequest` para mutações simples (1 chamada HTTP + `onSuccess`). Use try/catch manual para fluxos multi-step com lógica entre chamadas ou `router.push()` mid-flow.

**Toasts:** sempre via `notify` de `shared/lib/notify.ts` — nunca `addToast` direto. `useRequest` já trata erros; não duplique. Mutations devem mostrar toast em sucesso E em erro.

---

## Sessão e inatividade

**Inatividade:** `useInactivityLogout` → signOut após 30 min sem interação. Montado globalmente via `<InactivityGuard />` dentro de `<SessionProvider>` em `providers.tsx` — não mover para fora do provider (usa `useSession()`).

**JWT:** expira 8h após login (`auth.ts → session.maxAge`). Constante de inatividade em `config/constants/index.ts`.

**AI chat isolation:** `useAiChat(userId)` usa chaves `AI_CHAT_LOCAL_STORAGE_KEY(userId)` e `AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId)`. Nunca chamar sem `userId` ou com string estática — colapsaria histórico de todos os usuários na mesma chave.

---

## Padrão de simulados — ensure answers

Questões salvas podem não ter `Answer` no banco. Antes de iniciar tentativa ou carregar resultado, chamar `ensureCertSimuladoAnswers(id)` ou `ensureMockExamAnswers(id)`.

Ponto de uso 1: `SimuladosListTab.handleStart()` antes de `start*Attempt`.

Ponto de uso 2: página de resultado — ao detectar `answer === null` em qualquer questão, chamar ensure + refetch.

Não precisa chamar em: quiz Generate (gabarito incluído no fluxo), browse/library (só leitura).

---

## Regras visuais

- Sem gradientes (`bg-gradient-to-*`, `from-*`, `via-*`, `to-*`)
- Sem glassmorphism (`backdrop-blur-*`, `backdrop-filter`)
- Sem gradient text (`bg-clip-text text-transparent`)
- Sem colored shadows (`shadow-[...]` com rgba)
- Sem hover lifts (`hover:-translate-y-*`)
- Sempre tokens semânticos — nunca cores hard-coded

---

## Checklist nova página

- [ ] `<PageHeader>` como wrapper
- [ ] Todo texto via `t('chave')` — sem strings hardcoded
- [ ] `'use client'` se usar hooks
- [ ] Componentes page-specific em `app/(workspace)/<dominio>/<pagina>/components/`
- [ ] Botões via `buttonStyles.*` — sem `color=`, sem `variant="ghost/solid/shadow"`, icon-only com `isIconOnly` + `aria-label` + `size="sm"`
- [ ] Chips sempre `size="sm"`, cor via `color=`
- [ ] Inputs com `label` sempre acompanhados de `placeholder`; senha via `<PasswordInput>`
- [ ] Tokens semânticos, dark + light mode verificados
- [ ] HTTP via `useRequest`; toast de sucesso em toda mutation
- [ ] Lista com provider → `<SkeletonListLoader />` durante `isLoading`
- [ ] Estado vazio: `<EmptyState>` para feedback contextual (filtros, erros, widgets); `<IllustratedEmptyState>` para estado primário de lista/página

---

## Feature Gating

Gate em dois lugares: API (403) e UI (não renderiza).

- Client: `useSession() → session.user.plan`
- Server component: query `prisma.user` direto
- Limites de quota: `useUsageContext() → usage` (nunca `getBillingUsage()` direto)
