# Design: Reorganizar pastas de `app/api/`

## Context

As rotas de geração de questões estão agrupadas em `app/api/generator/`, sem relação explícita com seus domínios (certification vs public-exam). O objetivo é eliminar essa pasta intermediária e reorganizar as rotas em quatro grupos semânticos claros: `ai/`, `billing/`, `certification/` e `public-exam/`.

---

## Estrutura-alvo de `app/api/`

```
app/api/
├── auth/                               (inalterado)
├── webhooks/                           (inalterado)
├── ai/
│   └── ai-chat/                        (inalterado)
├── billing/
│   ├── checkout/                       (inalterado)
│   ├── portal/                         (inalterado)
│   └── usage/                          (inalterado)
├── certification/
│   ├── certifications/                 (inalterado)
│   ├── save-certification/             (inalterado)
│   ├── question-generator/             (movido de generator/question-generator/)
│   ├── save-questions/                 (movido de generator/save-questions/)
│   ├── get-answers/                    (movido de generator/get-anwers/ + typo corrigido)
│   ├── quiz-generator/                 (movido de generator/quiz-generator/)
│   └── browse-questions/
│       ├── questions/                  (movido de generator/browse-questions/questions/)
│       └── summary/                    (movido de generator/browse-questions/summary/)
└── public-exam/
    ├── public-exams/                   (inalterado)
    ├── exam-boards/                    (inalterado)
    ├── save-public-exam/               (inalterado)
    ├── question-generator/             (movido de generator/public-exam-question-generator/)
    ├── save-questions/                 (movido de generator/save-public-exam-questions/)
    ├── get-answers/                    (movido de generator/get-public-exam-answers/)
    └── browse-questions/
        ├── questions/                  (movido de generator/browse-public-exam-questions/questions/)
        └── summary/                    (movido de generator/browse-public-exam-questions/summary/)
```

---

## Mapeamento de URLs (antigo → novo)

| URL atual | URL nova |
|---|---|
| `/api/generator/question-generator` | `/api/certification/question-generator` |
| `/api/generator/save-questions` | `/api/certification/save-questions` |
| `/api/generator/get-anwers` | `/api/certification/get-answers` |
| `/api/generator/quiz-generator` | `/api/certification/quiz-generator` |
| `/api/generator/browse-questions/questions` | `/api/certification/browse-questions/questions` |
| `/api/generator/browse-questions/summary` | `/api/certification/browse-questions/summary` |
| `/api/generator/public-exam-question-generator` | `/api/public-exam/question-generator` |
| `/api/generator/save-public-exam-questions` | `/api/public-exam/save-questions` |
| `/api/generator/get-public-exam-answers` | `/api/public-exam/get-answers` |
| `/api/generator/browse-public-exam-questions/questions` | `/api/public-exam/browse-questions/questions` |
| `/api/generator/browse-public-exam-questions/summary` | `/api/public-exam/browse-questions/summary` |

Nota: o typo `get-anwers` é corrigido para `get-answers` no novo caminho.

---

## Arquivos que mudam

### Pastas de rotas: mover (11 pastas)

Cada `route.ts` é movido para o novo caminho. O conteúdo dos arquivos **não muda** — apenas o endereço no filesystem.

### `config/constants/index.ts`: atualizar 11 constantes

```typescript
// Certification
OPENAI_POST_URL        = '/certification/question-generator'
SAVE_QUESTIONS_URL     = '/certification/save-questions'
GET_ANSWERS_URL        = '/certification/get-answers'        // renomeado de GET_ANWERS_URL se existir
QUIZ_GENERATOR_URL     = '/certification/quiz-generator'
BROWSE_SUMMARY_URL     = '/certification/browse-questions/summary'
BROWSE_QUESTIONS_URL   = '/certification/browse-questions/questions'

// Public exam
PUBLIC_EXAM_GENERATOR_URL         = '/public-exam/question-generator'
SAVE_PUBLIC_EXAM_QUESTIONS_URL    = '/public-exam/save-questions'
GET_PUBLIC_EXAM_ANSWERS_URL       = '/public-exam/get-answers'
BROWSE_PUBLIC_EXAM_SUMMARY_URL    = '/public-exam/browse-questions/summary'
BROWSE_PUBLIC_EXAM_QUESTIONS_URL  = '/public-exam/browse-questions/questions'
```

### `features/connectors.ts`: sem mudanças de lógica

Os conectores já importam as constantes — as URLs serão atualizadas automaticamente via mudança nas constantes. Verificar se algum conector usa o nome `GET_ANWERS_URL` (typo) e atualizá-lo se necessário.

---

## Ordem de execução

1. Criar as novas pastas e mover os `route.ts` (11 arquivos)
2. Deletar as pastas de origem (incluindo a pasta `generator/` inteira)
3. Atualizar `config/constants/index.ts`
4. Verificar compilação: `npx tsc --noEmit`
5. Verificar que não há nenhuma referência ao prefixo `/generator/` no codebase

---

## Verificação

- `npx tsc --noEmit` deve passar sem erros
- `grep -r "/generator/" app/ features/ config/` deve retornar vazio
- Testar manualmente os endpoints principais após o deploy
