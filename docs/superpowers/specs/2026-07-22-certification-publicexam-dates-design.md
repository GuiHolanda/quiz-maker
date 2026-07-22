# Design: Datas de Criação e Edição nas Listas de Certificações e Concursos

**Data:** 2026-07-22
**Branch alvo:** feature/exam-metadata-fields

---

## Objetivo

Exibir as datas de criação e última edição nos triggers dos acordeões das listas de certificações e concursos públicos, dando ao usuário visibilidade temporal sobre seus registros.

---

## Decisões de Design

### Campos exibidos
- Criação (`createdAt`) e última edição (`updatedAt`), ambos sempre presentes.
- Quando `updatedAt === createdAt` (registro nunca editado), exibe apenas "Criado {date}" — o campo "Editado" é omitido.

### Formato de data
- Relativa no texto: "há 6 meses", "há 2 dias".
- Absoluta no hover (via `title`): "10 jan 2025".

### Layout do trigger do acordeão
- **Linha 1:** nome da certificação/concurso | provider/banca + ano + chip de tópicos/assuntos
- **Linha 2:** questões · duração · % de corte (esquerda) | datas (direita)

### Propagação de `updatedAt`
Qualquer edição — inclusive em tópicos/assuntos filhos — atualiza o `updatedAt` do pai. O Prisma `@updatedAt` cobre edições diretas no pai; mudanças nos filhos disparam um toque manual no service.

---

## Seção 1: Schema e Migration

Adicionar aos modelos `Certification` e `PublicExam` em **ambos** os schemas (`prisma/dev/schema.prisma` e `prisma/prod/schema.prisma`):

```prisma
createdAt   DateTime  @default(now())
updatedAt   DateTime  @updatedAt
```

Os modelos filhos (`CertificationTopic`, `PublicExamSubject`, `PublicExamTopic`) **não recebem** novos campos.

---

## Seção 2: Camada de Services

`@updatedAt` cobre edições diretas no pai automaticamente. Para mudanças em filhos, cada método relevante adiciona um toque no pai:

```ts
await prisma.certification.update({
  where: { id: certificationId },
  data: { updatedAt: new Date() },
});
```

**`CertificationService`** — tocar em:
- `addTopic`
- `updateTopic`
- `deleteTopic`

**`PublicExamService`** — tocar em:
- `addSubject`
- `updateSubject`
- `deleteSubject`
- `addTopic` (tópico de assunto)
- `updateTopic` (tópico de assunto)
- `deleteTopic` (tópico de assunto)

---

## Seção 3: Camada de API

### `GET /api/certification/certifications`
Adicionar ao objeto mapeado:
```ts
createdAt: certification.createdAt,
updatedAt: certification.updatedAt,
```

### `GET /api/public-exam/public-exams`
Idem:
```ts
createdAt: publicExam.createdAt,
updatedAt: publicExam.updatedAt,
```

### `shared/types/index.ts`
Adicionar a `Certification` e `PublicExam`:
```ts
createdAt: string;
updatedAt: string;
```

---

## Seção 4: Componentes de UI

### `RelativeDate` (`shared/components/ui/RelativeDate.tsx`)
Componente novo. Props: `date: string`.
- Exibe data relativa via `Intl.RelativeTimeFormat`.
- Atributo `title` com data absoluta formatada via `Intl.DateTimeFormat` (ex: "10 jan 2025") para tooltip nativo no hover.
- Sem dependências externas.

### `CertificationsListTab`
Atualizar `renderTriggerTitle`:
- Linha 1: nome | provider + chip de tópicos
- Linha 2: questões · duração · corte (esq) | datas com `RelativeDate` (dir)
- Só renderiza datas quando `updatedAt !== createdAt`; caso contrário, exibe apenas "Criado {date}"

### `PublicExamsListTab`
Mesmo padrão com campos adaptados: `name`, `examBoard.name + year`, `subjects`.

### i18n
Novas chaves em `public/messages/en.properties` e `public/messages/pt.properties`:
```properties
common.createdAt=Criado {date}
common.updatedAt=Editado {date}
```

---

## Fora de escopo

- Ordenação da lista por data de criação/edição.
- Filtros por data.
- Exibição de datas em outras partes do produto (simulados, questões).
