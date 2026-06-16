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

- **Fonte principal:** `Plus Jakarta Sans` (variável `--font-sans`)
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

```tsx
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
    <div className="app-bg">
      <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
        <div className="mb-8">
          <h1 className="page-header-title">{t('page.title')}</h1>
          <p className="page-header-subtitle mt-2">{t('page.subtitle')}</p>
        </div>
        <div className="bg-content1 border border-default-200 rounded-xl p-6">
          ...
        </div>
      </div>
    </div>
  );
}
```

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

### Generate Questions (`app/generate-questions/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Providers + layout `.app-bg` |
| `components/QuestionGeneratorForm.tsx` | Form de configuração (certification, topic, count) |
| `components/GeneratedQuestionsList.tsx` | Lista com select-all, botões de salvar/descartar |
| `components/GeneratedQuestionsCard.tsx` | Card individual: texto + opções (Listbox) + checkbox |

### Quiz (`app/quiz/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Providers + layout `.app-bg` |
| `components/QuizForm.tsx` | Form de configuração do quiz |
| `components/QuestionList.tsx` | Lista paginada + barra de progresso + botão finish |
| `components/QuestionCard.tsx` | Card interativo: Radio (1 resposta) ou Checkbox (N respostas) |
| `components/AnswredQuestionCard.tsx` | Card respondido: gabarito + explicações |

### Configure Certification (`app/configure-certification/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Provider + layout + HeroUI Tabs |
| `components/CertificationHeader.tsx` | Exibe nome/código da certificação selecionada |
| `components/NewCertificationTab.tsx` | Form de criação com validação |
| `components/CertificationsListTab.tsx` | Lista as certifications do usuário |
| `components/EditCertificationTab.tsx` | Select para escolher qual editar |
| `components/TopicForm.tsx` | Form de adição de tópico com Slider de percentual |

### Login / Auth (`app/login/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Layout `.auth-bg` |
| `components/LoginForm.tsx` | Email + senha + Google OAuth + links |

---

## Componentes compartilhados (`sharedComponents/`)

| Componente | Uso |
|---|---|
| `ui/navbar.tsx` | Shell de navegação global (sticky, `bg-background border-divider`) |
| `ui/footer.tsx` | Rodapé global |
| `ui/theme-switch.tsx` | Toggle light/dark via next-themes |
| `ui/language-switch.tsx` | Toggle PT/EN via `useTranslation` |
| `ui/BusyDialog.tsx` | Modal de loading durante geração de questões |
| `ui/PaginationControls.tsx` | Botões prev/next reutilizáveis |
| `ui/ItemsPerPageSelect.tsx` | Select de itens por página |
| `ui/NumberInput.tsx` | Input numérico sem spinners (`.no-number-spinners`) |
| `CertificationManager.tsx` | Autocomplete de certificação + Select de tópico |
| `SectionsTable.tsx` | Tabela de tópicos com Slider de min/max |

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

- [ ] Usar `.app-bg` (autenticada) ou `.auth-bg` (pública de auth) como wrapper
- [ ] Container `container mx-auto max-w-7xl pt-8 px-6 pb-12`
- [ ] Título com `.page-header-title`, subtítulo com `.page-header-subtitle`
- [ ] Cards com `bg-content1 border border-default-200 rounded-xl`
- [ ] Todo texto de UI via `t('chave')` — sem strings hardcoded
- [ ] Componente marcado com `'use client'` se usar hooks
- [ ] Componentes page-specific em `app/<pagina>/components/`, nunca em `sharedComponents/`
- [ ] Usar HeroUI para todos os elementos de UI
- [ ] Usar tokens semânticos, nunca cores hard-coded
- [ ] Verificar em dark e light mode
