  # MyQuiz — Frontend Context

Guia de referência para padronização de páginas e componentes. Todas as decisões visuais estão aqui.

---

## Design System — Flat Indigo + Amber

O estilo da aplicação é **flat design**: superfícies sólidas, bordas simples, sem gradientes, sem blur, sem glassmorphism. Usa tokens semânticos do HeroUI para suporte automático a dark/light mode.

### Paleta de cores (configurada em `tailwind.config.js`)

| Token | Dark | Light |
|---|---|---|
| `background` | `#0f172a` (Slate-900) | `#f8fafc` (Slate-50) |
| `foreground` | `#f8fafc` | `#0f172a` |
| `content1` (surface) | `#1e293b` (Slate-800) | `#ffffff` |
| `content2` | `#334155` (Slate-700) | `#f1f5f9` (Slate-100) |
| `primary` (accent) | `#4f46e5` (Indigo-600) | `#4f46e5` |
| `secondary` | `#f59e0b` (Amber-500) | `#f59e0b` |

### Tokens semânticos (use estes, nunca cores hard-coded)

```
bg-background       → fundo da página
bg-content1         → superfícies (cards, seções)
text-foreground      → texto principal
text-default-500     → texto secundário
text-default-400     → texto terciário / muted
text-primary         → texto de acento (links, labels de seção)
border-divider       → separadores
border-default-200   → bordas de cards/inputs
bg-default-100       → backgrounds sutis (hover, tabs inativos)
```

### Fundos de página

| Classe CSS | Onde usar |
|---|---|
| `.app-bg` | Todas as páginas autenticadas (quiz, generate, configure) |
| `.auth-bg` | Páginas de autenticação (login, register, forgot-password) |

```tsx
// Página autenticada
<div className="app-bg">
  <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
    ...
  </div>
</div>

// Página de auth
<div className="auth-bg">
  <div className="bg-content1 border border-default-200 rounded-2xl p-8 w-full max-w-md">
    ...
  </div>
</div>
```

### Classes CSS custom (`styles/globals.css`)

| Classe | Uso |
|---|---|
| `.app-bg` | min-height para páginas autenticadas |
| `.auth-bg` | Flex centering para páginas de auth |
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

### Primário

```tsx
<Button
  className="bg-primary text-primary-foreground font-semibold rounded-lg
             hover:opacity-90 transition-opacity duration-200"
>
  {t('common.save')}
</Button>
```

### Secundário (bordered)

```tsx
<Button
  variant="bordered"
  className="border-default-300 text-default-600 hover:text-foreground
             hover:border-default-400 font-semibold transition-colors duration-200"
>
  {t('common.cancel')}
</Button>
```

### Flat (ação discreta)

```tsx
<Button
  variant="flat"
  className="bg-default-100 border border-default-200 text-default-600
             hover:bg-default-200 rounded-lg transition-colors"
>
  {t('common.signOut')}
</Button>
```

### Pequeno (ação em tabela/card)

```tsx
<Button
  size="sm"
  className="bg-primary text-primary-foreground text-xs font-semibold
             rounded-lg hover:opacity-90 h-8 px-4 transition-opacity duration-200"
>
  {t('common.submit')}
</Button>
```

---

## Padrão de cards e seções

```tsx
// Card / seção
<div className="bg-content1 border border-default-200 rounded-xl p-6">
  ...
</div>
```

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
| Borda focus | `border-primary` (Indigo 600) |
| Label | `text-xs font-normal text-default-400` |
| Transição | `transition-colors duration-200` |

O `bordered` usa fundo transparente + borda semântica, com foco mudando para indigo. Funciona em dark e light mode automaticamente.

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
    tabList: 'bg-default-100 border border-default-200 rounded-xl p-1 gap-1',
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
    trigger: 'px-6 py-4 hover:bg-default-100 transition-colors duration-200',
    content: 'px-6 pb-6',
    indicator: 'text-default-400',
  }}
>
```

---

## Estrutura de páginas e componentes

### Homepage (`app/page.tsx`)

Página pública, fundo `bg-background`, `'use client'`.

| Seção | Componente | Descrição |
|---|---|---|
| Hero | `HeroSection` | min-h-[90vh], CTA duplo, texto primary + foreground |
| Stats | `StatsSection` | Grid 2→4 colunas, valores `text-primary` |
| Features | `FeaturesSection` | Grid 3 colunas, cards `bg-content1 border-default-200` |
| Certifications | `CertificationsSection` | Badges flex-wrap com logo colorido |
| Testimonials | `TestimonialsSection` | Grid 3 colunas, cards `bg-content1` |
| Companies | `CompaniesSection` | Logos texto com cor da marca |
| CTA | `CtaSection` | Box `bg-primary/5 border-primary/20` |

### Domínio: Certifications (`app/(workspace)/certifications/`)

#### Generate Questions (`certifications/generate/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Providers + layout `.app-bg` |
| `components/QuestionGeneratorForm.tsx` | Form de configuração (certification, topic, count) |
| `components/GeneratedQuestionsList.tsx` | Lista com select-all, botões de salvar/descartar |
| `components/GeneratedQuestionsCard.tsx` | Card individual: texto + opções (Listbox) + checkbox |

#### Quiz (`certifications/quiz/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Providers + layout `.app-bg` |
| `components/QuizForm.tsx` | Form de configuração do quiz |
| `components/QuestionList.tsx` | Lista paginada + barra de progresso + botão finish |
| `components/QuestionCard.tsx` | Card interativo: Radio (1 resposta) ou Checkbox (N respostas) |
| `components/AnswredQuestionCard.tsx` | Card respondido: gabarito + explicações |

#### Configure Certification (`certifications/configure/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout + HeroUI Tabs (abre por padrão na aba **Minhas certificações**) |
| `components/CertificationHeader.tsx` | Exibe nome/código da certificação selecionada |
| `components/NewCertificationTab.tsx` | Form de criação com validação |
| `components/CertificationsListTab.tsx` | Accordion das certificações do usuário com botão de excluir, modal de confirmação, empty state com CTA e `SkeletonListLoader` durante o carregamento |
| `components/EditCertificationModal.tsx` | Modal de edição de metadados (label, key, provider) |
| `components/EditCertificationTab.tsx` | Select para escolher qual editar |
| `components/TopicForm.tsx` | Form de adição de tópico com Slider de percentual |

#### Browse Questions (`certifications/browse/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout `.app-bg` |
| `components/BrowseQuestionsContent.tsx` | Layout wrapper principal |
| `components/CertificationAccordion.tsx` | Accordion de seleção de certificação |
| `components/TopicAccordion.tsx` | Accordion de seleção de tópico |
| `components/QuestionList.tsx` | Lista de questões filtradas |
| `components/QuestionDetailPanel.tsx` | Painel de detalhe da questão |

---

### Domínio: Public Exams (`app/(workspace)/public-exams/`)

#### Configure Public Exam (`public-exams/configure/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout + HeroUI Tabs |
| `components/NewPublicExamTab.tsx` | Form de criação de concurso |
| `components/PublicExamsListTab.tsx` | Accordion dos concursos do usuário com botão de excluir, modal de confirmação, empty state com CTA e `SkeletonListLoader` durante o carregamento |
| `components/EditPublicExamModal.tsx` | Modal de edição de concurso |

#### Generate Public Exam Questions (`public-exams/generate/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Providers + layout `.app-bg` |
| `components/PublicExamQuestionGeneratorForm.tsx` | Form de configuração (concurso, assunto, count) |
| `components/GeneratedPublicExamQuestionsList.tsx` | Lista com select-all, botões de salvar/descartar |
| `components/GeneratedPublicExamQuestionsCard.tsx` | Card individual de questão de concurso |

#### Browse Public Exam Questions (`public-exams/browse/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout `.app-bg` |
| `components/PublicExamAccordion.tsx` | Accordion de seleção de concurso |
| `components/SubjectAccordion.tsx` | Accordion de seleção de assunto |
| `components/PublicExamQuestionList.tsx` | Lista de questões filtradas |
| `components/PublicExamQuestionDetailPanel.tsx` | Painel de detalhe da questão |

#### Simulados (`public-exams/simulados/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout `.app-bg` — tabs List/New |
| `components/SimuladosListTab.tsx` | Lista de simulados com histórico de tentativas |
| `components/NewSimuladoTab.tsx` | Form de criação de simulado |
| `[id]/tentativa/[attemptId]/page.tsx` | Interface interativa de resposta |
| `[id]/tentativa/[attemptId]/components/SimuladoQuestionList.tsx` | Lista paginada com tracking de respostas |
| `[id]/resultado/[attemptId]/page.tsx` | Página de resultados com breakdown por assunto |
| `[id]/resultado/[attemptId]/components/ResultQuestionCard.tsx` | Card com resposta do usuário vs gabarito |

### Login / Auth (`app/login/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Layout `.auth-bg` |
| `components/LoginForm.tsx` | Email + senha + Google OAuth + links |

---

### Admin Dashboard (`app/admin/`)

Layout completamente separado do `(workspace)` — usa sidebar própria, sem o navbar global. Acesso restrito a `plan === 'admin'`, verificado server-side no layout.

| Arquivo | Papel |
|---|---|
| `layout.tsx` | Server component: auth guard + sidebar com links de navegação |
| `page.tsx` | Redirect para `/admin/overview` |
| `overview/page.tsx` | KPIs (total users, assinaturas, questões geradas, uso médio) + distribuição por plano |
| `users/page.tsx` | Tabela de usuários com edição inline de plano e `customQuotaOverride` |
| `analytics/page.tsx` | Barras de distribuição de planos + top 10 usuários por questões geradas |
| `audit-log/page.tsx` | Histórico paginado de ações administrativas |

**Padrão de dados nas páginas admin:** `overview/page.tsx` e `analytics/page.tsx` são server components que chamam `AdminService` diretamente (não usam `features/connectors.ts`). `users/page.tsx` e `audit-log/page.tsx` são client components que usam os connectors admin via axios normalmente.

---

## Componentes compartilhados (`shared/components/`)

### UI genéricos (`shared/components/ui/`)

| Componente | Uso |
|---|---|
| `PageHeader.tsx` | Layout padrão de página autenticada — `.app-bg` + container + título/subtítulo |
| `navbar.tsx` | Shell de navegação global (sticky, `bg-background border-divider`) |
| `footer.tsx` | Rodapé global |
| `theme-switch.tsx` | Toggle light/dark via next-themes |
| `language-switch.tsx` | Toggle PT/EN via `useTranslation` |
| `BusyDialog.tsx` | Modal de loading durante operações assíncronas |
| `SkeletonListLoader.tsx` | Skeleton placeholder para listas que dependem de fetch (HeroUI Skeleton, props `count`/`height`/`className`). Usado pelos list tabs de certificações, concursos e simulados durante o carregamento inicial do provider. |
| `FormAccordion.tsx` | Accordion com `<Form>` integrado, BusyDialog e footer de ações |
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
| `useCertificationsContext.hook.ts` | Acesso ao estado de certificações do `CertificationsProvider` |
| `usePublicExamsContext.hook.ts` | Acesso ao estado de concursos do `PublicExamsProvider` |
| `useQuizContext.hook.ts` | Acesso ao estado do quiz do `QuizProvider` |
| `useMockExamsContext` | Exportado direto de `features/providers/mockExams.provider.tsx` |

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

## Toasts (`@heroui/toast`)

Sempre mostre feedback em mutations (save/update/delete), tanto em sucesso quanto em erro.

```tsx
import { addToast } from '@heroui/toast';

// Sucesso
addToast({ title: t('toast.success'), description: t('certification.saved'), color: 'success' });

// Erro (manual, fora de useRequest)
addToast({ title: t('toast.error'), description: t('toast.somethingWrong'), color: 'danger' });
```

- `color`: `'success'` | `'danger'` | `'warning'` | `'default'`
- Erros HTTP via `useRequest` já chamam `addToast` — não adicione um segundo toast para esses casos.

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
Hover:       hover:bg-default-100 (cards, items)
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
- [ ] Usar tokens semânticos, nunca cores hard-coded
- [ ] Verificar em dark e light mode
- [ ] Chamadas HTTP via `useRequest` — nunca `useState` + `try/catch` manual
- [ ] Toast de sucesso em toda mutation; erro já coberto por `useRequest`
- [ ] Para listas que dependem de fetch via provider (`CertificationsProvider`, `PublicExamsProvider`, `MockExamsProvider`), renderizar `<SkeletonListLoader />` enquanto `isLoading` for `true` — evita flash de estado vazio antes do fetch completar

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

Para verificar limites de quota no client, use `getBillingUsage()` → `UsageStats`. O campo `publicExamsLimit === 0` indica que o plano não tem acesso a concursos.

