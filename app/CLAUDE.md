  # CertifiqueAI — Frontend Context

Guia de referência para padronização de páginas e componentes. Todas as decisões visuais estão aqui.

---

## Design System — Navy + Amber-Orange

O estilo da aplicação é **flat design**: superfícies sólidas, bordas simples, sem gradientes, sem blur, sem glassmorphism. Usa tokens semânticos do HeroUI para suporte automático a dark/light mode.

### Paleta de cores (configurada em `tailwind.config.mjs`)

| Token | Dark | Light |
|---|---|---|
| `background` | `#09112a` (Navy-900) | `#f8fafc` (Slate-50) |
| `background2` | `#070e20` (Navy-950) | `#eef2f6` |
| `foreground` | `#e8edf3` | `#0f172a` |
| `content1` (surface) | `#0c1832` (Navy-800) | `#ffffff` |
| `content2` | `#10203c` (Navy-700) | `#f1f5f9` (Slate-100) |
| `primary` (accent) | `#e07820` (Amber-Orange) | `#4f46e5` (Indigo-600) |
| `secondary` | `#f59e0b` (Amber-500) | `#f59e0b` |
| `danger` | `#e05252` (Muted Red) | `#e05252` |
| `success` | `#3db87a` (Sage Green) | `#3db87a` |
| `warning` | `#d4a012` (Golden Amber) | `#d4a012` |

### Tokens semânticos (use estes, nunca cores hard-coded)

```
bg-background       → fundo da página (navy profundo)
bg-background2      → sidebar e header (navy mais escuro)
bg-content1         → superfícies (cards, seções)
bg-content2         → superfícies aninhadas, cabeçalhos de tabela
text-foreground     → texto principal
text-default-500    → texto secundário
text-default-400    → texto terciário / muted
text-primary        → texto de acento amber (links, labels de seção, active nav)
border-divider      → separadores
border-default-200  → bordas de cards/inputs
```

**Atenção:** `bg-default-100` não deve ser usado como superfície — use `bg-content2` no lugar. `bg-default-100` pode aparecer apenas como `hover:bg-default-100` em tabs inativos (HeroUI interno).

### Fundos de página

| Classe CSS | Onde usar |
|---|---|
| `.app-bg` | Páginas autenticadas com `PageHeader` (quiz, generate, configure) |

> **Nota:** `.app-bg` usa `min-height: 100%`. A página `/dashboard` usa `bg-background` diretamente (não `bg-default-100/50`).

As páginas de auth (login, register, forgot-password, reset-password) usam um layout próprio em duas colunas (`AuthSplitLayout` em `app/(auth)/components/AuthSplitLayout.tsx`) e **não** dependem de `.auth-bg`. Veja `app/(auth)/layout.tsx`.

```tsx
// Página autenticada
<div className="app-bg">
  <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
    ...
  </div>
</div>

// Página de auth — usa AuthSplitLayout
<AuthSplitLayout>
  {/* conteúdo do form */}
</AuthSplitLayout>
```

### Classes CSS custom (`styles/globals.css`)

| Classe | Uso |
|---|---|
| `.app-bg` | min-height para páginas autenticadas |
| `.page-header-title` | font-size: 2rem, font-weight: 800 |
| `.page-header-subtitle` | font-size: 0.9rem |

---

## Tipografia

- **Fonte principal:** `Inter` (variável `--font-sans`, definida em `config/fonts.ts`)
- **Fonte mono:** `Fira Code` (variável `--font-mono`)

### Hierarquia de texto

```
Título de página  → .page-header-title (text-foreground, extrabold, ~2rem)
H2 de seção       → text-3xl font-extrabold text-foreground
H3 de card        → text-xl font-bold text-foreground
Label de seção    → text-xs font-semibold text-primary
Label de campo    → text-xs font-medium text-default-400
Corpo principal   → text-sm text-default-500
Corpo secundário  → text-xs text-default-400
```

> **Regra:** Não usar `uppercase`, `tracking-widest`, `tracking-[0.2em]` nem `tracking-[0.05em]` em nenhum label ou texto de UI.

---

## Padrão de botões

Todos os classNames de botão vivem em `config/constants/buttonStyles.ts`. **Nunca repita as strings inline** — importe e use as constantes.

```tsx
import { buttonStyles } from '@/config/constants/buttonStyles';
```

### Primário

```tsx
<Button className={buttonStyles.primary}>{t('common.save')}</Button>
```

### Secundário (bordered)

```tsx
<Button className={buttonStyles.secondary} variant="bordered">{t('common.cancel')}</Button>
```

### Flat (ação discreta)

```tsx
<Button className={buttonStyles.flat}>{t('common.signOut')}</Button>
```

### Pequeno (ação em tabela/card)

```tsx
<Button className={buttonStyles.primarySm} size="sm">{t('common.submit')}</Button>
```

### Danger (confirmação de exclusão)

```tsx
<Button className={buttonStyles.danger}>{t('common.delete')}</Button>
```

### Danger flat (ação destrutiva discreta)

```tsx
<Button className={buttonStyles.dangerFlat}>{t('common.discard')}</Button>
```

### Icon-only

Sempre requer `isIconOnly` + `size="sm"` + `aria-label` obrigatório.

```tsx
// Neutro (fechar, dispensar)
<Button isIconOnly aria-label={t('common.close')} className={buttonStyles.iconOnly.neutral} size="sm" variant="light">
  <FontAwesomeIcon icon={faXmark} />
</Button>

// Primário (confirmar, enviar)
<Button isIconOnly aria-label={t('common.save')} className={buttonStyles.iconOnly.primary} size="sm">
  <FontAwesomeIcon icon={faCheck} />
</Button>

// Danger (excluir, remover)
<Button isIconOnly aria-label={t('common.remove')} className={buttonStyles.iconOnly.danger} size="sm" variant="light">
  <FontAwesomeIcon icon={faTrash} />
</Button>
```

### Regras obrigatórias

- **Nunca use `color=` em `<Button>`** — toda coloração vem via `className={buttonStyles.*}`
- **Nunca use `variant="ghost"`, `variant="solid"` ou `variant="shadow"`** — variants aprovadas: `bordered` (secondary), `light` (icon-only), ou ausente (primary/flat/danger)
- **Nunca use `variant="light"` em botões com texto** — apenas em icon-only
- **`aria-label` é obrigatório** em todo botão `isIconOnly`
- **`<span role="button">` é proibido** — use sempre `<Button>` do HeroUI

---

## Padrão de cards e seções

```tsx
// Card / seção
<div className="bg-content1 border border-default-200 rounded-xl p-6">
  ...
</div>
```

---

## Padrão de chips e tags

Chips comunicam status ou categorias. Sempre `size="sm"` — nunca override de tamanho via `className`.

```tsx
// Padrão (flat — use por default)
<Chip color="success" size="sm" variant="flat">{t('simulado.statusAnswered')}</Chip>

// Bordered
<Chip color="primary" size="sm" variant="bordered">{label}</Chip>

// Solid
<Chip color="danger" size="sm" variant="solid">{label}</Chip>
```

### Score color pattern

```tsx
function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';
  return 'danger';
}

<Chip color={scoreColor(pct)} size="sm" variant="flat">{pct}%</Chip>
```

### Regras obrigatórias

- **`size="sm"` é obrigatório** — nunca omitir, nunca usar `md` ou `lg`
- **Nunca sobreponha tamanho via `className`** (ex: `text-2xl px-6`) — se precisar de uma exibição grande, use um `<div>` ou `<p>` com as classes de cor semântica (`text-success`, `text-warning`, `text-danger`)
- **`color=` é o único mecanismo de coloração** — não use `className` para colorir chips

---

## Padrão de inputs (todos os componentes)

Todos os inputs usam `variant="bordered"` via `inputProperties` de `config/constants/inputStyles.ts`. Sempre use spread — nunca repita `variant` e `classNames` manualmente.

```tsx
import { inputProperties } from '@/config/constants/inputStyles';

// Input / Input type="number"
<Input {...inputProperties.input} />

// Select
<Select {...inputProperties.select} />

// Autocomplete (inputProps aponta para o wrapper interno; classNames do topo controla o popover)
<Autocomplete {...inputProperties.autocomplete} />

// Navbar search (classNames extra via spread do objeto interno)
<Input {...inputProperties.input} classNames={{ ...inputProperties.input.classNames, input: 'text-sm' }} />
```

### Padrão visual dos inputs

| Propriedade | Valor |
|---|---|
| Raio | `rounded-lg` (8px) — via `inputWrapper` / `trigger` |
| Altura | 40px — HeroUI `size="md"` padrão |
| Borda resting | `border-default-300` |
| Borda focus | `border-primary` (Amber-Orange dark / Indigo light) |
| Label | `text-xs font-normal text-default-400` |
| Transição | `transition-colors duration-200` |

O `bordered` usa fundo `bg-background` + borda semântica, com foco mudando para amber-orange (dark) ou indigo (light). Funciona em dark e light mode automaticamente.

### Regra obrigatória: `label` exige `placeholder`

`inputProperties.input` define `labelPlacement: 'outside'`. No HeroUI v2, o label **só renderiza acima do campo quando `placeholder` está presente** — sem placeholder o label colapsa para dentro do input como floating, dando a aparência de "só placeholder, sem label". Portanto:

```tsx
// ❌ Errado — label vai aparecer dentro do campo como floating
<Input label={t('login.emailLabel')} {...inputProperties.input} />

// ✅ Certo — passar placeholder em todo Input/Select/PasswordInput com label
<Input label={t('login.emailLabel')} placeholder={t('login.emailPlaceholder')} {...inputProperties.input} />
```

Quando não houver dica útil para o placeholder, use `placeholder=" "` (espaço em branco) como fallback documentado — mas a UX é melhor com texto descritivo (ex.: "voce@exemplo.com", "Sua senha"). Vale para `<Input>`, `<Select>` e `<PasswordInput>` igualmente.

### Senhas — sempre `PasswordInput`

Para campos de senha, use `<PasswordInput>` (`shared/components/ui/PasswordInput.tsx`) em vez de `<Input type="password">`. Ele já inclui toggle de visibilidade (olho/olho-cortado), labels acessíveis traduzidos, e o spread de `inputProperties.input`. Aceita todas as props do `<Input>` exceto `type` e `endContent` (controlados internamente).

---

## Layout padrão das páginas internas

Use o componente `<PageHeader>` de `shared/components/ui/PageHeader.tsx` — não copie o markup manualmente.

```tsx
import { PageHeader } from '@/shared/components/ui/PageHeader';

export default function MyPage() {
  return (
    <CertificationsProvider>
      <PageContent />
    </CertificationsProvider>
  );
}

function PageContent() {
  const { t } = useTranslation();

  return (
    <PageHeader title={t('page.title')} subtitle={t('page.subtitle')}>
      <div className="bg-content1 border border-default-200 rounded-xl p-6">
        ...
      </div>
    </PageHeader>
  );
}
```

`PageHeader` aceita `maxWidth?: '4xl' | '7xl'` (default `'7xl'`). Já inclui `.app-bg`, container e espaçamentos — não duplique.

---

## Padrão de Tabs

```tsx
<Tabs
  classNames={{
    tabList: 'bg-content2 border border-default-200 rounded-xl p-1 gap-1',
    tab: 'text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold',
    cursor: 'bg-primary rounded-xl',
  }}
>
```

---

## Padrão de Accordion

```tsx
<Accordion
  itemClasses={{
    base: 'bg-content1 border border-default-200 rounded-xl',
    title: 'text-sm font-bold text-foreground',
    trigger: 'px-6 py-4 hover:bg-content2 transition-colors duration-200',
    content: 'px-6 pb-6',
    indicator: 'text-default-400',
  }}
>
```

---

## Padrão de empty state

Sempre usar `<EmptyState>` de `shared/components/ui/EmptyState.tsx` para qualquer feedback de "sem dados". **Não criar markup inline** com card + título + botão — usa o componente.

### API

```tsx
import { EmptyState } from '@/shared/components/ui/EmptyState';

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: {
    readonly label: string;
    readonly href?: string;       // navegação — renderiza com NextLink
    readonly onPress?: () => void; // callback — ex.: trocar de aba
    readonly icon?: IconDefinition; // default: faPlus
  };
}
```

### Quando usar `href` vs `onPress`

- **`href`** — quando a CTA deve **navegar** para outra rota (ex.: "criar primeira certificação" leva a `/certifications/configure`).
- **`onPress`** — quando a CTA deve **trocar de aba ou disparar uma ação local** dentro da mesma página (ex.: "Gerar questões" troca para a aba "Gerar" da página atual).
- Se nem `href` nem `onPress` forem fornecidos, o botão não é renderizado — útil quando o componente filho não conhece o controlador de abas.

### Exemplos

```tsx
// CTA de navegação (questions page sem certificações)
<EmptyState
  title={t('certification.noCertificationsTitle')}
  description={t('certification.noCertificationsDescription')}
  action={{
    label: t('certification.tabNew'),
    href: '/certifications/configure',
  }}
/>

// CTA de troca de aba (biblioteca vazia → aba Gerar)
<EmptyState
  title={t('browse.noQuestions')}
  description={t('browse.noQuestionsDescription')}
  action={{
    label: t('browse.generateCta'),
    onPress: () => setSelectedTab('generate'),
  }}
/>

// Apenas título + descrição (sem ação acionável)
<EmptyState
  title={t('common.noResultsTitle')}
  description={t('common.noResultsDescription')}
/>
```

### Propagação do callback entre páginas/abas

Quando o `EmptyState` está dentro de um filho (ex.: `<BrowseCategoriesView>`, `SimuladosListTab`) cuja página pai controla as abas, o filho expõe uma prop opcional (`onGenerateClick?`, `onCreateNew?`) e a página pai passa o setter de aba como callback. Filho sem callback → `EmptyState` aparece sem CTA.

### Onde já é usado

- `CertificationsListTab` / `PublicExamsListTab` — "sem certificações/concursos" com `onPress` para a aba "New"
- Cert e concurso `questions/page.tsx` Generate tab — guard com `href` para `/.../configure`
- `BrowseCategoriesView` (usado nas duas rotas de `questions/`) — "sem questões salvas" com `onPress` para a aba "Gerar"
- Cert e concurso `SimuladosListTab` — "sem simulados" com `onPress` para a aba "New"

### Copy

Toda i18n: `title`, `description` e `action.label` sempre via `t('chave')`. Para "sem dados", convencionar pares `*.noXTitle` / `*.noXDescription` / `*.tabNew` (ou similar) — descrição deve dizer **o que fazer a seguir**, não apenas repetir o título.

---

## Padrão de browse — accordion aninhado genérico

Para bibliotecas de questões (certificações e concursos) o padrão é **accordion aninhado em coluna única com search** parametrizado por um único componente `<BrowseCategoriesView>` que recebe um `BrowseDomainConfig`. Categoria expande subcategoria, subcategoria expande a lista de questões, que ocupa toda a largura da página. Nunca criar wrappers de accordion aninhado por domínio — o generic já cobre.

### Arquitetura

```
shared/components/browse/
├── BrowseCategoriesView.tsx          ← orchestrator: search + accordion aninhado + estado
├── BrowseQuestionsToolbar.tsx        ← counter + select-all + trash bulk (dentro de cada subcategoria)
└── types.ts                          ← BrowseCategoryNode, BrowseDomainConfig<T>

shared/browse-configs/
├── certificationBrowseConfig.ts      ← adapter para BrowseSummary + endpoints de certs
└── publicExamBrowseConfig.ts         ← adapter para PublicExamBrowseSummary + endpoints de concursos
```

### Como consumir

Diretamente da `page.tsx`:

```tsx
'use client';
import { BrowseCategoriesView } from '@/shared/components/browse/BrowseCategoriesView';
import { certificationBrowseConfig } from '@/shared/browse-configs/certificationBrowseConfig';

// dentro do JSX da aba Browse:
<BrowseCategoriesView
  config={certificationBrowseConfig}
  embedded
  onGenerateClick={() => setSelectedTab('generate')}
/>
```

Para adicionar um terceiro domínio (ex.: cursos livres): criar um novo `BrowseDomainConfig` mapeando `fetchSummary`, `mapSummary`, `fetchQuestions`, `deleteQuestion` e `i18nPrefix`. Nenhum componente novo é necessário.

### Delete (single + bulk)

A lógica de delete está no hook `features/hooks/useBrowseQuestionsDelete.hook.ts`. Ele encapsula estado do modal, `Promise.allSettled` para partial-failures, e toasts. `CategoryQuestionsPanel` já o consome. **Nunca duplicar essa lógica em outros componentes.**

Comportamento:
- **Single delete** — cada linha tem um trash inline (visível no hover no desktop, sempre visível no mobile). Clique → modal `browse.singleDeleteConfirm{Title,Body}`.
- **Bulk delete** — checkbox por linha (Gmail-style, aparece no hover) + toolbar com trash. Clique → modal `browse.bulkDeleteConfirm{Title,Body}`.

### i18n prefix

Cada `BrowseDomainConfig` declara `i18nPrefix: 'browse' | 'concurso.browse'`. O view resolve `${prefix}.title`, `${prefix}.subtitle`, `${prefix}.searchPlaceholder`, `${prefix}.noQuestions*`, `${prefix}.generateCta`, `${prefix}.searchNoResults`. Chaves de baixo-nível (`browse.hasAnswer`, `browse.optionsSectionLabel`, `browse.bulkDeleteConfirm*`, etc.) são **compartilhadas** entre os domínios e ficam no namespace `browse.*`.

### Regras visuais reforçadas

- Row hover: `hover:bg-content2` — nunca `bg-primary/5` ou `bg-content2` estático (colide com chips `default flat`).
- Row selecionada / expandida: `bg-primary/10 border-l-2 border-l-primary`.
- Row com checkbox marcado (não expandida): `bg-primary/10`.
- Tags padronizadas: todas usam `<Chip size="sm" variant="flat">`; a hierarquia visual vem da cor (colorido = status; default = neutros como difficulty/topic).
- Search input sticky no topo, com filtro case+diacritic-insensitive (`.normalize('NFD')`) e `useDeferredValue` para não travar a árvore em queries longas.

---

## Estrutura de páginas e componentes

### Arquitetura de layouts — Route Groups

`app/layout.tsx` (raiz) **não renderiza Sidebar/Header/AiChat**. Esses elementos são aplicados pelos layouts de cada route group:

| Group | Layout | Chrome renderizada | Rotas |
|---|---|---|---|
| `(marketing)` | `app/(marketing)/layout.tsx` | Navbar + Footer | `/` (homepage), futuras `/privacy`, `/terms`, etc. |
| `(workspace)` | `app/(workspace)/layout.tsx` | Sidebar + WorkspaceHeader + AiChatWrapper | `/dashboard`, `/certifications/*`, `/public-exams/*`, `/billing` |
| `(auth)` | `app/(auth)/layout.tsx` | Top bar minimalista (chip CertifiqueAI + LanguageSwitch) | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| `admin/` (não é group) | `app/admin/layout.tsx` | Sidebar admin própria | `/admin/*` |

### Layout do Workspace — App Shell

O `(workspace)` usa um **app shell** com sidebar fixa à esquerda e coluna de conteúdo à direita. Estrutura do `layout.tsx`:

```tsx
<div className="flex min-h-screen bg-background">
  <Sidebar />                          {/* w-64, sticky, desktop only */}
  <div className="flex flex-col flex-1 min-w-0">
    <WorkspaceHeader />                {/* h-14, hidden md:flex, desktop only */}
    <main className="flex-grow pt-14 md:pt-0">{children}</main>
  </div>
  <AiChatWrapper />
</div>
```

**Regras críticas:**
- `min-w-0` na coluna de conteúdo é **obrigatório** — sem isso, tabelas e accordions sangram para fora do flex container
- `pt-14 md:pt-0` no `<main>` compensa a top bar mobile do Sidebar (`h-14 fixed`); no desktop não há top bar, então zero padding
- Não há `<Footer>` no workspace — o rodapé foi removido do layout autenticado
- O `<Footer>` continua existindo em `(marketing)/layout.tsx`

### Sidebar (`shared/components/ui/sidebar.tsx`)

Componente `'use client'` que renderiza três regiões distintas:

**Desktop** (`hidden md:flex`): painel `w-64 sticky h-screen` com:
- Brand header (`h-14`) alinhado ao `WorkspaceHeader`
- Navegação com seções colapsáveis (Certifications, Concursos) e item flat (Dashboard com `faHouse`)
- Rodapé com contadores de uso (questões, certificações, concursos)

**Mobile top bar** (`flex md:hidden fixed top-0 z-40 h-14`): hamburger + logo + avatar

**Mobile drawer** (HeroUI `<Drawer placement="left" size="xs">`): mesmo conteúdo de nav + contadores

**Contadores no rodapé do sidebar** (aparecem após o `usage` ser carregado):
- Questões usadas: `questionsUsed / questionsLimit` com barra de progresso colorida (`bg-danger` >90%, `bg-warning` >70%, `bg-primary` demais); oculta quando `questionsLimit === -1`
- Certificações: `certificationsUsed / certificationsLimit`; `∞` quando `-1`
- Concursos: `publicExamsUsed / publicExamsLimit`; oculto quando `publicExamsLimit === 0` (plano sem acesso)

**O que NÃO está no sidebar** (foi movido para o `WorkspaceHeader`): user dropdown, theme switch, language switch, manage account, upgrade CTA, sign out.

### WorkspaceHeader (`shared/components/ui/workspace-header.tsx`)

Componente `'use client'` `hidden md:flex` que ocupa a faixa `h-14` do topo da coluna de conteúdo. Contém:
- Campo de busca com ícone de lupa e atalho `⌘K` (visual, sem lógica de busca por enquanto)
- Botão de notificações com badge vermelho
- `UsageBadge` (barra de questões usadas — se oculta automaticamente para planos ilimitados)
- **Dropdown completo do usuário** via HeroUI `<Dropdown>`:
  - User info (nome + email, read-only)
  - Manage Account → `/billing`
  - Upgrade CTA (apenas `plan === 'free'`)
  - Theme switch + Language switch (read-only items)
  - Sign out
- `UpgradeModal` (controlado por `isUpgradeOpen` local)
- Consome `useUsageContext()` do `UsageProvider` — **não faz fetch direto de `getBillingUsage()`**

**Nota:** O sidebar e o WorkspaceHeader consomem o mesmo `UsageProvider` via `useUsageContext()`. O provider é montado no `app/(workspace)/layout.tsx` e faz um único fetch ao montar. `refreshUsage()` é chamado nas páginas de questões após salvar para atualizar os contadores sem reload de página.

Route groups (`(name)`) são transparentes na URL — `app/(marketing)/page.tsx` continua servindo `/`. Para criar uma página nova:
- **Pública sem login (marketing)** → `app/(marketing)/<rota>/page.tsx` e adicionar em `publicRoutePrefixes` de `auth.config.ts` (ou tratamento exato para `/`).
- **Autenticada** → `app/(workspace)/<rota>/page.tsx`.
- **Auth flow** → `app/(auth)/<rota>/page.tsx` e adicionar prefixo em `publicRoutePrefixes`.

### Dashboard (`app/(workspace)/dashboard/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Página `'use client'` com dados mock — performance header, KPI ribbon, focus areas, score trend sparkline, recent sessions, domain breakdown |

A página é **100% mock por enquanto** — todos os dados são constantes estáticas. Quando o backend de métricas for implementado, substituir as constantes `MOCK_*` por chamadas via `features/connectors.ts`. A estrutura de componentes usa renderer functions (`renderKpi`) seguindo o padrão do projeto.

Não usa `<PageHeader>` — aplica seu próprio fundo `bg-background` para alinhar com o sistema de cores navy.

### Domínio: Certifications (`app/(workspace)/certifications/`)

#### Questions (`certifications/questions/`)

Página unificada (HeroUI Tabs) com aba **Gerar** (form + lista de questões geradas) e aba **Biblioteca** (browse das questões salvas). Estado da aba persiste em `?tab=generate|browse` para deep-link.

| Arquivo | Papel |
|---|---|
| `page.tsx` | Providers (`CertificationsProvider` + `QuizProvider`) + Tabs + sync com `?tab=`. Aba Browse renderiza `<BrowseCategoriesView config={certificationBrowseConfig} embedded onGenerateClick={...} />` diretamente |
| `components/QuestionGeneratorForm.tsx` | Form de configuração (certification, topic, count) |
| `components/GeneratedQuestionsList.tsx` | Lista com select-all, salvar/descartar; `onSaved` auto-troca para Biblioteca |
| `components/GeneratedQuestionsCard.tsx` | Card individual: texto + opções (Listbox) + checkbox |

#### Configure Certification (`certifications/configure/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout + HeroUI Tabs (abre por padrão na aba **Minhas certificações**) |
| `components/CertificationHeader.tsx` | Exibe nome/código da certificação selecionada |
| `components/NewCertificationTab.tsx` | Form de criação com validação |
| `components/CertificationsListTab.tsx` | Accordion das certificações do usuário com botão de excluir, modal de confirmação, `<EmptyState>` com CTA `onPress` para a aba "New" e `SkeletonListLoader` durante o carregamento |
| `components/EditCertificationModal.tsx` | Modal de edição de metadados (label, key, provider) |
| `components/EditCertificationTab.tsx` | Select para escolher qual editar |
| `components/TopicForm.tsx` | Form de adição de tópico com Slider de percentual |

#### Simulados (`certifications/simulados/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider (`CertSimuladosProvider` + `CertificationsProvider`) + tabs List/New |
| `components/SimuladosListTab.tsx` | Lista de simulados; chama `ensureCertSimuladoAnswers(id)` antes de `startCertSimuladoAttempt(id)` |
| `components/NewSimuladoTab.tsx` | Form de criação (Select cert + Input nome + total + distribuição por tópico) |
| `[id]/tentativa/[attemptId]/page.tsx` | Interface interativa de resposta (usa `shared/components/SimuladoQuestionList`) |
| `[id]/resultado/[attemptId]/page.tsx` | Página de resultado com breakdown por tópico; faz fallback chamando `ensureCertSimuladoAnswers` se detectar questões sem `answer` |

---

### Domínio: Public Exams (`app/(workspace)/public-exams/`)

#### Configure Public Exam (`public-exams/configure/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout + HeroUI Tabs |
| `components/NewPublicExamTab.tsx` | Form de criação de concurso |
| `components/PublicExamsListTab.tsx` | Accordion dos concursos do usuário com botão de excluir, modal de confirmação, `<EmptyState>` com CTA `onPress` para a aba "New" e `SkeletonListLoader` durante o carregamento |
| `components/EditPublicExamModal.tsx` | Modal de edição de concurso |

#### Questions (`public-exams/questions/`)

Página unificada (HeroUI Tabs) com aba **Gerar** e aba **Biblioteca**, mesmo padrão do escopo de certificações.

| Arquivo | Papel |
|---|---|
| `page.tsx` | `PublicExamsProvider` + Tabs + sync com `?tab=`. Aba Browse renderiza `<BrowseCategoriesView config={publicExamBrowseConfig} embedded onGenerateClick={...} />` diretamente |
| `components/PublicExamQuestionGeneratorForm.tsx` | Form de configuração (concurso, assunto, count) |
| `components/GeneratedPublicExamQuestionsList.tsx` | Lista com select-all, salvar/descartar; `onSaved` auto-troca para Biblioteca |
| `components/GeneratedPublicExamQuestionsCard.tsx` | Card individual de questão de concurso |

#### Simulados (`public-exams/simulados/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout `.app-bg` — tabs List/New |
| `components/SimuladosListTab.tsx` | Lista de simulados; chama `ensureMockExamAnswers(id)` antes de `startMockExamAttempt(id)` |
| `components/NewSimuladoTab.tsx` | Form de criação de simulado |
| `[id]/tentativa/[attemptId]/page.tsx` | Interface interativa de resposta (usa `shared/components/SimuladoQuestionList`) |
| `[id]/resultado/[attemptId]/page.tsx` | Página de resultados com breakdown por matéria; faz fallback chamando `ensureMockExamAnswers` se detectar questões sem `answer` |

### Login / Auth (`app/(auth)/`)

Grupo de rotas com layout próprio (`app/(auth)/layout.tsx`) **sem** Navbar/Footer/AiChat — apenas uma top bar discreta com a chip da marca e o `LanguageSwitch`. O conteúdo das páginas usa `AuthSplitLayout` (painel navy/amber à esquerda + form à direita).

| Arquivo | Papel |
|---|---|
| `layout.tsx` | Wrapper minimalista de auth (sem chrome global) |
| `components/AuthSplitLayout.tsx` | Layout em duas colunas (marca + form) reutilizado por todas as páginas auth |
| `login/components/LoginForm.tsx` | Email + senha (com `PasswordInput`) + Google OAuth |
| `register/components/RegisterForm.tsx` | Nome + email + senha + criar conta |
| `forgot-password/components/ForgotPasswordForm.tsx` | Pedir reset por e-mail |
| `reset-password/components/ResetPasswordForm.tsx` | Trocar senha via token de e-mail |

---

### Admin Dashboard (`app/admin/`)

Layout completamente separado do `(workspace)` — usa sidebar própria, sem o navbar global. Acesso restrito a `plan === 'admin'`, verificado server-side no layout.

| Arquivo | Papel |
|---|---|
| `layout.tsx` | Server component: auth guard + sidebar com links de navegação |
| `page.tsx` | Redirect para `/admin/overview` |
| `overview/page.tsx` | KPIs (total users, assinaturas, questões geradas, uso médio) + distribuição por plano |
| `users/page.tsx` | Tabela com edição inline de plano e `customQuotaOverride`; colunas: Tokens (total/avg/in·out), Custo Total (BRL), Custo/questão — cotação buscada via `getExchangeRate()` |
| `analytics/page.tsx` | Server component com 4 seções: Distribuição de Planos, Top 10 Usuários (tokens + custo por user), Consumo de Tokens (5 KPI cards), **Margem por Plano** (receita estimada vs custo tokens, margem colorida, break-even) |
| `audit-log/page.tsx` | Histórico paginado de ações administrativas |

**Padrão de dados nas páginas admin:** `overview/page.tsx` e `analytics/page.tsx` são server components que chamam `AdminService` diretamente (não usam `features/connectors.ts`). `users/page.tsx` e `audit-log/page.tsx` são client components que usam os connectors admin via axios normalmente.

**Constantes de custo** (todas em `config/constants/index.ts`):
- `GPT_54_PRICING_USD = { inputPerMillion: 2.50, outputPerMillion: 15.00 }` — preço do modelo
- `USD_TO_BRL_FALLBACK = 5.70` — fallback quando a AwesomeAPI falhar
- `PLAN_PRICES_BRL_MONTHLY = { free: 0, pro: 19.80, pro_ai: 39.80 }` — usado na tabela de margem

**Cotação USD/BRL:** buscada em runtime de `economia.awesomeapi.com.br` com `next: { revalidate: 3600 }`. Em `analytics/page.tsx` (server component) o fetch é direto. Em `users/page.tsx` (client component) é feito via `getExchangeRate()` connector que chama `GET /api/admin/exchange-rate`.

---

## Componentes compartilhados (`shared/components/`)

### UI genéricos (`shared/components/ui/`)

| Componente | Uso |
|---|---|
| `PageHeader.tsx` | Layout padrão de página autenticada — `.app-bg` + container + título/subtítulo |
| `sidebar.tsx` | Shell lateral do workspace — navegação, contadores de uso. Ver seção "Sidebar" acima. |
| `workspace-header.tsx` | Top bar do workspace (desktop) — busca, notificações, user dropdown. Ver seção "WorkspaceHeader" acima. |
| `navbar.tsx` | **Legado** — top navbar horizontal, não usado pelo workspace. Ainda importado por `(marketing)/layout.tsx` via marketing-navbar. Não remover. |
| `footer.tsx` | Rodapé — usado apenas em `(marketing)/layout.tsx`. Removido do workspace. |
| `theme-switch.tsx` | Toggle light/dark via next-themes |
| `language-switch.tsx` | Toggle PT/EN via `useTranslation` |
| `BusyDialog.tsx` | Modal de loading durante operações assíncronas |
| `SkeletonListLoader.tsx` | Skeleton placeholder para listas que dependem de fetch (HeroUI Skeleton, props `count`/`height`/`className`). Usado pelos list tabs de certificações, concursos e simulados durante o carregamento inicial do provider. |
| `EmptyState.tsx` | Card padrão de "sem dados" — título obrigatório, descrição opcional, e CTA opcional via `action: { label, href?, onPress?, icon? }`. `href` renderiza com `NextLink`; `onPress` é callback. Ícone padrão `faPlus`. Ver seção dedicada abaixo. |
| `FormAccordion.tsx` | Accordion com `<Form>` integrado, BusyDialog e footer de ações |
| `PasswordInput.tsx` | Wrapper de `<Input>` com toggle olho/olho-cortado (`faEye`/`faEyeSlash`). Gerencia `type=password\|text` internamente, spread de `inputProperties.input` por padrão. Botão `tabIndex={-1}` + `onMouseDown.preventDefault()` para não roubar foco. `aria-label` via `aria.showPassword`/`aria.hidePassword`. **Sempre passar `placeholder` quando usar `labelPlacement="outside"` — ver seção "Padrão de inputs".** |
| `PaginationControls.tsx` | Botões prev/next reutilizáveis |
| `ItemsPerPageSelect.tsx` | Select de itens por página |
| `PlanBadge.tsx` | Chip de plano do usuário (Free/Pro) com link para billing |
| `UsageBadge.tsx` | Badge de uso de questões com barra de progresso. Oculto quando `questionsLimit === -1` (planos ilimitados). |
| `UpgradeModal.tsx` | Modal de upgrade de plano |
| `AiChatWrapper.tsx` | Wrapper do AI chat — renderiza FAB + Drawer apenas para planos `pro_ai`, `tester`, `admin` |
| `AiChatFab.tsx` | Botão flutuante para abrir o AI chat |
| `AiChatDrawer.tsx` | Drawer lateral do AI chat |

### Domínio compartilhado (`shared/components/`)

| Componente | Uso |
|---|---|
| `CertificationManager.tsx` | Autocomplete de certificação + Select de tópico |
| `PublicExamManager.tsx` | Select de concurso + Select de assunto |
| `SectionsTable.tsx` | Tabela de tópicos com Slider de min/max (certifications) |
| `PublicExamSubjectsTable.tsx` | Tabela de assuntos com Slider de min/max (public exams) |
| `QuestionCard.tsx` | Card interativo de questão: Radio (1 resposta) ou Checkbox (N respostas) |
| `AnsweredQuestionCard.tsx` | Card de questão respondida: gabarito + explicações |
| `icons.tsx` | Ícones FontAwesome reutilizáveis |

---

## Hooks (`features/hooks/`)

| Hook | Uso |
|---|---|
| `useRequest.hook.ts` | Wrapper de chamadas HTTP: loading, error, toast automático de erro |
| `useTranslation.hook.ts` | `{ t, language, setLanguage }` — acesso às strings i18n |
| `useUsageContext.hook.ts` | `{ usage: UsageStats \| null, refreshUsage: () => void }` — acesso ao `UsageProvider`. Chame `refreshUsage()` após salvar questões para atualizar contadores em tempo real. |
| `useCertificationsContext.hook.ts` | Acesso ao estado de certificações do `CertificationsProvider` |
| `usePublicExamsContext.hook.ts` | Acesso ao estado de concursos do `PublicExamsProvider` |
| `useQuizContext.hook.ts` | Acesso ao estado do quiz do `QuizProvider` |
| `useMockExamsContext` | Exportado direto de `features/providers/mockExams.provider.tsx` |
| `useAiChat.hook.ts` | Estado completo do AI chat — mensagens, streaming, upload de edital, inatividade. Recebe `userId` e isola o histórico em localStorage por usuário. Ver seção abaixo. |
| `useInactivityLogout.hook.ts` | Auto-logout por inatividade — monitora eventos de interação na janela toda e chama `signOut()` após 30 min sem atividade. Ver seção abaixo. |

### `useRequest` — padrão para chamadas HTTP

Sempre use `useRequest` para operações assíncronas em componentes. Trata loading, erros de validação e toast de erro automaticamente.

```tsx
import { useRequest } from '@/features/hooks/useRequest.hook';
import { saveCertification } from '@/features/connectors';

const { loading, error, request } = useRequest(saveCertification);

// Chamar:
await request(payload, () => {
  // onSuccess — executado após resposta bem-sucedida
  addToast({ title: t('toast.success'), description: t('certification.saved'), color: 'success' });
});
```

`useRequest` lança o toast de erro automaticamente em caso de falha — não duplique.

---

## Toasts (User Feedback)

**Sempre usar `notify` de `shared/lib/notify.ts`. Não importar `addToast` direto.**

```tsx
import { notify } from '@/shared/lib/notify';

notify.success(t('toast.success'), t('certification.savedDescription'));
notify.error(t('toast.error'), t('toast.somethingWrong'));
notify.warning(t('toast.validationError'), t('error.titleCodeRequired'));
notify.info(t('info.title'), t('info.description'));
```

Title e description sempre via `t()` — nunca strings hardcoded. Description é
opcional na assinatura mas **fortemente recomendada**: um toast só com "Sucesso"
sem detalhe é antipattern. A assinatura `(title, description?)` torna a falta
de detalhe visível no call site durante revisão de código.

`useRequest` já mostra toast em erro HTTP — **não duplicar** no `catch` do componente.

Sempre mostre feedback em mutations (save/update/delete), tanto em sucesso quanto em erro.

---

## Sessão, auto-logout por inatividade e AI chat history

### Auto-logout global — `useInactivityLogout`

`features/hooks/useInactivityLogout.hook.ts` monitora eventos de interação (`mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`) na janela toda. Após `AI_CHAT_LOGOUT_INACTIVITY_MS` (30 min, definido em `config/constants/index.ts`) sem qualquer evento, chama `signOut({ callbackUrl: '/login' })`.

O hook é ativado via o componente interno `<InactivityGuard />` em `app/providers.tsx` — ele roda para **qualquer usuário autenticado**, em todas as páginas, independentemente do AI chat estar aberto.

```tsx
// app/providers.tsx (padrão atual)
function InactivityGuard() {
  useInactivityLogout();  // só ativo quando status === 'authenticated'
  return null;
}
// … inserido como filho direto de <SessionProvider>
```

**Regra:** Nunca mova `<InactivityGuard />` para fora do `<SessionProvider>` — o hook usa `useSession()` e quebraria.

### JWT maxAge — `auth.ts`

`session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }` — o cookie JWT expira **8 horas** após o login, independentemente de atividade. Garante que sessões abertas em dispositivos compartilhados ou esquecidos expirem mesmo sem interação do usuário.

Para alterar o timeout de inatividade (30 min) ou o ceiling da sessão (8h), edite apenas as constantes em `config/constants/index.ts`:

```ts
export const AI_CHAT_LOGOUT_INACTIVITY_MS = 30 * 60 * 1000;  // inatividade → signOut()
// maxAge em auth.ts é independente e deve ser >= AI_CHAT_LOGOUT_INACTIVITY_MS
```

### AI chat — histórico isolado por usuário

`useAiChat(userId)` isola o histórico em localStorage por usuário. As chaves são funções:

```ts
AI_CHAT_LOCAL_STORAGE_KEY(userId)       // "AI_CHAT_MESSAGES_<userId>"
AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId)  // "AI_CHAT_FOLLOWUP_TS_<userId>"
```

Quando `userId` muda (troca de usuário no mesmo browser), o hook:
1. Aborta o stream em andamento
2. Limpa timers de inatividade de follow-up
3. Zera todo o estado em memória
4. Carrega o histórico do novo usuário do localStorage

`AiChatWrapper.tsx` extrai o `userId` da sessão e passa para `AiChatDrawer`, que repassa para `useAiChat`:

```tsx
// AiChatWrapper
const userId = session?.user?.id ?? '';
// ...
<AiChatDrawer isOpen={isOpen} userId={userId} onClose={...} />
```

**Invariante:** Nunca use `useAiChat()` sem `userId` ou com string estática — isso colapsaria o histórico de todos os usuários na mesma chave.

### O que NÃO testar unitariamente (fora de escopo)

`useInactivityLogout` e `useAiChat` são React hooks que dependem de `window`, timers, `useSession` e streaming HTTP. Sem infraestrutura de UI testing (React Testing Library + jsdom), estes hooks estão fora do escopo de testes unitários — comportamento validado por integração manual.

---

## Padrão de simulados — garantir gabarito antes da tentativa

Simulados (cert e concurso) são compostos por questões salvas pelo usuário, que podem ter sido geradas sem `Answer` no banco (o fluxo de **salvar questões** não dispara `get-answers` automaticamente). Sem gabarito, a página de resultado fica com `correctOptions = []` (cálculo de acerto quebra) e o endpoint `/explanation` retorna 404.

**Regra:** sempre que um usuário for **iniciar uma tentativa** ou **revisar um resultado**, o frontend deve chamar o endpoint `ensure*Answers` antes do fetch principal.

### Endpoints

| Endpoint | Descrição |
|---|---|
| `POST /api/certification-simulados/[id]/answers` | Gera `Answer` rows faltantes para questões do simulado de certificação |
| `POST /api/mock-exams/[id]/answers` | Gera `PublicExamAnswer` rows faltantes para simulado de concurso |

Ambos são **idempotentes** — questões que já têm answer são puladas. Retornam `{ generated: N }`.

### Connectors

```ts
import { ensureCertSimuladoAnswers, ensureMockExamAnswers } from '@/features/connectors';

await ensureCertSimuladoAnswers(simuladoId);   // cert
await ensureMockExamAnswers(mockExamId);       // concurso
```

### Pontos de uso obrigatórios

1. **Ao iniciar uma tentativa** — em `SimuladosListTab.handleStart()` (cert e concurso), antes de chamar `start*Attempt`:

```ts
async function handleStart(simulado) {
  setStartingId(simulado.id);
  try {
    await ensureCertSimuladoAnswers(simulado.id);   // garante gabarito
    const attempt = await startCertSimuladoAttempt(simulado.id);
    router.push(`/.../tentativa/${attempt.id}`);
  } catch (e) {
    notify.error(...);
    setStartingId(null);
  }
}
```

2. **Ao carregar o resultado** — em `[id]/resultado/[attemptId]/page.tsx` (cert e concurso), fallback resiliente para simulados antigos que foram criados antes desse fluxo existir:

```tsx
useEffect(() => {
  let cancelled = false;

  async function load() {
    const data = await getCertSimuladoResult(id, attemptId);
    if (cancelled) return;

    const hasMissingAnswer = data.questions.some((sq) => !sq.question.answer);
    if (hasMissingAnswer) {
      try {
        await ensureCertSimuladoAnswers(id);
        const refreshed = await getCertSimuladoResult(id, attemptId);
        if (!cancelled) setResult(refreshed);
        return;
      } catch {
        // fall back to partial data
      }
    }
    setResult(data);
  }

  load();
  return () => { cancelled = true; };
}, [id, attemptId]);
```

### Quando NÃO precisa chamar

- Quizzes do tipo "Generate" (`questions/page.tsx`) — geram questões via LLM com gabarito incluído no mesmo fluxo.
- Browse / library — apenas leitura, não precisa de answer pra renderizar lista.

### Custo e tempo

`ensure*Answers` chama OpenAI em batches de 10 questões, agrupando por tópico/matéria. Um simulado de 40 questões em 4 tópicos = 4 chamadas LLM em paralelo (sequenciais no service, mas tópicos pequenos terminam rápido). Cobertura via `BusyDialog`/`isLoading` na UI evita confusão.

---

## Padrões de responsividade

```
Mobile-first. Breakpoints principais: sm (640px), md (768px), lg (1024px)

Texto:       text-3xl sm:text-4xl lg:text-5xl
Grid:        grid-cols-1 md:grid-cols-3
Flex móvel:  flex-col sm:flex-row
Nav:         hidden sm:flex (desktop) / sm:hidden (mobile hamburger)
Container:   max-w-7xl mx-auto px-6
```

---

## Padrões de animação e transição

```
Hover:       hover:opacity-90 (botões primários)
Hover:       hover:bg-content2 (cards, items)
Transição:   transition-opacity duration-200 (botões)
Transição:   transition-colors duration-200 (cards, inputs)
```

---

## Regras visuais

- **Sem gradientes** — nunca usar `bg-gradient-to-*`, `from-*`, `via-*`, `to-*`
- **Sem glassmorphism** — nunca usar `backdrop-blur-*`, `backdrop-filter`
- **Sem gradient text** — nunca usar `bg-clip-text text-transparent`
- **Sem colored shadows** — nunca usar `shadow-[...]` com rgba colors
- **Sem hover lifts** — nunca usar `hover:-translate-y-*`
- **Sempre usar tokens semânticos** — `text-foreground` ao invés de `text-white`, `border-divider` ao invés de `border-white/[0.06]`

---

## Checklist ao criar uma nova página

- [ ] Usar `<PageHeader>` de `shared/components/ui/PageHeader.tsx` como wrapper
- [ ] Container `container mx-auto max-w-7xl pt-8 px-6 pb-12` (já incluído no `PageHeader`)
- [ ] Título com `.page-header-title`, subtítulo com `.page-header-subtitle` (já incluído no `PageHeader`)
- [ ] Cards com `bg-content1 border border-default-200 rounded-xl`
- [ ] Todo texto de UI via `t('chave')` — sem strings hardcoded
- [ ] Componente marcado com `'use client'` se usar hooks
- [ ] Componentes page-specific em `app/(workspace)/<dominio>/<pagina>/components/`, nunca em `shared/components/`
- [ ] Usar HeroUI para todos os elementos de UI
- [ ] **Botões via `buttonStyles.*`** de `config/constants/buttonStyles.ts` — nunca repita className inline. Nunca use `color=` em `<Button>`. Nunca use `variant="ghost"`, `variant="solid"` ou `variant="shadow"`. Icon-only exige `isIconOnly` + `aria-label` + `size="sm"`
- [ ] **`<span role="button">` é proibido** — use sempre `<Button isIconOnly>` do HeroUI
- [ ] **Chips sempre com `size="sm"`** — nunca omitir. Use `color=` para coloração; nunca `className` para sobrepor tamanho
- [ ] **`<Input>`/`<Select>`/`<PasswordInput>` com `label` SEMPRE acompanhados de `placeholder`** — sem isso o label colapsa para dentro do campo como floating. Para campos de senha use `<PasswordInput>` (toggle de visibilidade incluso).
- [ ] Usar tokens semânticos, nunca cores hard-coded
- [ ] Verificar em dark e light mode
- [ ] Chamadas HTTP via `useRequest` — nunca `useState` + `try/catch` manual
- [ ] Toast de sucesso em toda mutation; erro já coberto por `useRequest`
- [ ] Para listas que dependem de fetch via provider (`CertificationsProvider`, `PublicExamsProvider`, `MockExamsProvider`), renderizar `<SkeletonListLoader />` enquanto `isLoading` for `true` — evita flash de estado vazio antes do fetch completar
- [ ] Para qualquer estado "sem dados", usar `<EmptyState>` de `shared/components/ui/EmptyState.tsx` — nunca markup inline. Sempre incluir `title` + `description`; CTA via `href` (navegação) ou `onPress` (trocar de aba)
- [ ] Em fluxos de simulado (cert/concurso), chamar `ensure*Answers(id)` antes de iniciar tentativa **e** ao detectar `answer === null` em qualquer questão na página de resultado

---

## Feature Gating — padrão de uso

Quando uma feature depende de plano, gate em dois lugares:

1. **API** — o route handler verifica o plano e retorna 403 se não autorizado
2. **UI** — o componente/item não é renderizado para usuários sem acesso

Para verificar plano no client, use `useSession()` → `session.user.plan` (o campo `plan` é populado pelo `session` callback do NextAuth e está disponível client-side via `useSession`).

Para verificar plano no server component, leia direto do banco:
```ts
const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
```

Para verificar limites de quota no client, use `useUsageContext()` → `usage: UsageStats`. O campo `publicExamsLimit === 0` indica que o plano não tem acesso a concursos. Não chame `getBillingUsage()` diretamente em componentes — consuma o `UsageProvider` via hook.

