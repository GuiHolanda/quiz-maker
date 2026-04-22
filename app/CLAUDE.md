# MyQuiz — Frontend Context

Guia de referência para padronização de páginas e componentes. Todas as decisões visuais estão aqui.

---

## Design System — Claymorphism

O estilo da aplicação é **claymorphism**: superfícies translúcidas com múltiplas camadas de sombra, bordas sutis e blur de fundo. Fundo escuro com hierarquia visual por opacidade de branco.

### Fundos de página

Nunca use `bg-white` ou `bg-gray-*`. Dois fundos existem:

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
  <div className="clay-card p-8 w-full max-w-md">
    ...
  </div>
</div>
```

### Classes CSS custom (`styles/globals.css`)

| Classe | Uso | Característica visual |
|---|---|---|
| `.clay-card` | Container principal de conteúdo | `border-radius: 28px`, blur 24px, sombra profunda (64px) |
| `.clay-section` | Seção dentro de um card | `border-radius: 20px`, blur 16px, sombra média (40px) |
| `.clay-question-card` | Card individual de questão | `border-radius: 16px`, sombra leve (20px) |
| `.clay-divider` | Divisor entre seções | `border-color: rgba(255,255,255,0.1)` |
| `.page-header-title` | Título das páginas internas | Gradiente `violet → indigo → blue`, font-extrabold |
| `.page-header-subtitle` | Subtítulo das páginas internas | `rgba(255,255,255,0.35)`, 0.9rem |

---

## Tipografia

- **Fonte principal:** `Plus Jakarta Sans` (variável `--font-sans`) — todos os textos
- **Fonte mono:** `Fira Code` (variável `--font-mono`) — blocos de código

### Hierarquia de texto

```
Título de página  → .page-header-title  (gradiente, extrabold, ~2rem)
H2 de seção       → text-3xl font-extrabold text-white
H3 de card        → text-xl font-bold text-white
Label             → text-xs uppercase tracking-[0.2em] text-violet-400 font-semibold
Corpo principal   → text-sm text-white/70 ou text-zinc-400
Corpo secundário  → text-xs text-white/40 ou text-zinc-500
```

---

## Paleta de cores

### Cores principais

| Papel | Valor |
|---|---|
| Fundo app | `#0a0a1a → #110a2e → #0a1628` (gradiente radial) |
| Fundo auth | `#0f0a1e → #1a0a3d → #0d1b3e` (gradiente radial) |
| Navbar | `#0a0a1a/80` |
| Homepage static | `#0a1628` |

### Escala de branco (opacidade)

```
text-white          → títulos principais
text-white/90       → texto de input
text-white/80       → texto relevante
text-white/70       → texto de corpo
text-white/60       → texto secundário
text-white/50       → nav items, labels
text-white/40       → texto desabilitado, numeração
text-white/35       → números de questão
text-white/30       → metadata de questão
```

### Acento — Violet/Indigo (CTA, gradientes)

```
from-violet-600 to-indigo-600   → botão primário, cursor de tab ativo
violet-500/10, violet-400/30    → backgrounds sutis, bordas
violet-400                      → section labels, active nav
violet-300 → cyan-300           → gradientes de stat
```

### Bordas

```
border-white/[0.06]   → separadores sutis (navbar bottom, section borders)
border-white/[0.07]   → clay-question-card
border-white/[0.08]   → cards gerais
border-white/[0.1]    → clay-card, clay-divider
border-white/20       → botão bordered
```

### Alertas e estados

```
rose-500 / rose-400   → erros
amber-500 / orange-500 → warning (testimonials accent)
```

---

## Padrão de botões

### Primário (CTA gradient)

```tsx
<Button
  radius="full"
  className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-8
             shadow-[0_6px_24px_rgba(139,92,246,0.5)]
             hover:shadow-[0_8px_32px_rgba(139,92,246,0.65)] hover:-translate-y-0.5
             transition-all duration-200"
>
  {t('common.save')}
</Button>
```

### Secundário (bordered)

```tsx
<Button
  variant="bordered"
  radius="full"
  className="border-white/20 text-white/70 hover:text-white hover:border-white/40
             font-semibold px-8 transition-all duration-200"
>
  {t('common.cancel')}
</Button>
```

### Flat (ação discreta)

```tsx
<Button
  variant="flat"
  className="bg-white/[0.06] border border-white/[0.08] text-white/60
             hover:bg-white/[0.1] hover:text-white/80 rounded-xl transition-all"
>
  {t('common.signOut')}
</Button>
```

### Pequeno (ação em tabela/card)

```tsx
<Button
  size="sm"
  className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs
             font-semibold rounded-xl shadow-[0_3px_10px_rgba(139,92,246,0.35)]
             hover:shadow-[0_4px_14px_rgba(139,92,246,0.5)] h-8 px-4 transition-all duration-200"
>
  {t('common.submit')}
</Button>
```

---

## Layout padrão das páginas internas

Todas as páginas autenticadas seguem este template:

```tsx
export default function MyPage() {
  return (
    <CertificationsProvider>   {/* se usar certifications */}
      <MyDomainProvider>       {/* se tiver estado de domínio */}
        <PageContent />
      </MyDomainProvider>
    </CertificationsProvider>
  );
}

function PageContent() {
  const { t } = useTranslation();

  return (
    <div className="app-bg">
      <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="page-header-title">{t('page.title')}</h1>
          <p className="page-header-subtitle mt-2">{t('page.subtitle')}</p>
        </div>

        {/* Conteúdo */}
        <div className="clay-card p-6">
          ...
        </div>
      </div>
    </div>
  );
}
```

---

## Estrutura de páginas e componentes

### Homepage (`app/page.tsx`)

Página pública, fundo `bg-[#0a1628]`, `'use client'`.

| Seção | Componente | Descrição |
|---|---|---|
| Hero | `HeroSection` | min-h-[90vh], blobs de gradiente animados, CTA duplo |
| Stats | `StatsSection` | Grid 2→4 colunas, valores com gradiente violet→cyan |
| Features | `FeaturesSection` | Grid 3 colunas, cards com `tailwind-variants` (blue/cyan/violet) |
| Certifications | `CertificationsSection` | Badges flex-wrap com logo colorido |
| Testimonials | `TestimonialsSection` | Grid 3 colunas, cards com avatar gradient |
| Companies | `CompaniesSection` | Logos texto com cor da marca, opacity-30 → hover:opacity-60 |
| CTA | `CtaSection` | Box gradient violet-900→indigo-900, blobs decorativos |

### Generate Questions (`app/generate-questions/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Providers + layout `.app-bg` |
| `components/QuestionGeneratorForm.tsx` | Form de configuração (certification, topic, count) |
| `components/GeneratedQuestionsList.tsx` | Lista com select-all, botões de salvar/descartar |
| `components/GeneratedQuestionsCard.tsx` | Card individual: texto + opções (Listbox) + checkbox de seleção |

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

**Padrão de Tabs:**
```tsx
<Tabs
  classNames={{
    tabList: 'bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1 gap-1',
    tab: 'text-white/40 data-[selected=true]:text-white/90 data-[selected=true]:font-semibold',
    cursor: 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 shadow-[0_2px_8px_rgba(139,92,246,0.4)] rounded-xl',
  }}
>
```

### Login / Auth (`app/login/`)

| Arquivo | Papel |
|---|---|
| `page.tsx` | Layout `.auth-bg` + `.clay-card` |
| `components/LoginForm.tsx` | Email + senha + Google OAuth + links |

**Padrão de input em auth:**
```tsx
classNames={{
  inputWrapper: [
    'bg-white/5 border-white/10 rounded-2xl',
    'shadow-[inset_0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)]',
    'data-[hover=true]:bg-white/[0.08] data-[hover=true]:border-violet-500/40',
    'data-[focus=true]:border-violet-500/60 data-[focus=true]:bg-white/[0.08]',
    'transition-all duration-200',
  ],
  input: 'text-white/90 placeholder:text-white/30 text-sm',
  label: 'text-white/50 text-xs font-medium',
}}
```

---

## Componentes compartilhados (`sharedComponents/`)

| Componente | Uso |
|---|---|
| `ui/navbar.tsx` | Shell de navegação global (sticky, backdrop-blur) |
| `ui/footer.tsx` | Rodapé global, client component (usa `useTranslation`) |
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
Hover lift:    hover:-translate-y-0.5 (botões CTA)
Hover lift 2:  hover:-translate-y-1 (feature cards)
Transição:     transition-all duration-200 (padrão)
Transição:     transition-colors duration-300 (cards)
Blobs:         blur-3xl, pointer-events-none (decorativos, posição absoluta)
```

---

## Checklist ao criar uma nova página

- [ ] Usar `.app-bg` (autenticada) ou `.auth-bg` (pública de auth) como wrapper
- [ ] Container `container mx-auto max-w-7xl pt-8 px-6 pb-12`
- [ ] Título com `.page-header-title`, subtítulo com `.page-header-subtitle`
- [ ] Todo texto de UI via `t('chave')` — sem strings hardcoded
- [ ] Componente marcado com `'use client'` se usar hooks
- [ ] Componentes page-specific em `app/<pagina>/components/`, nunca em `sharedComponents/`
- [ ] Usar HeroUI para todos os elementos de UI — não criar custom inputs, modais ou selects do zero
