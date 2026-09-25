# Architecture Decision Records (ADRs)

Registro das decisões arquiteturais do CertifiqueAI: **por que** algo foi decidido, o que foi descartado e o que
custa. O **quê/quando** mora em [docs/roadmap/](../roadmap/); o **como** e as **regras de negócio** moram em
[docs/sdd/](../sdd/). Ver [ADR-0001](0001-registrar-decisoes-em-adr-e-sdd.md) para o processo completo.

## Índice

| ADR | Título | Status | Tópico |
|---|---|---|---|
| [0001](0001-registrar-decisoes-em-adr-e-sdd.md) | Registrar decisões e regras de negócio em ADRs e SDDs | Aceita | Processo |
| [0002](0002-persistencia-de-feedback-sem-foreign-key.md) | Persistência de feedback em tabelas sem FK, com snapshot | Aceita | [Feedback e comunicação](../sdd/feedback-e-comunicacao.md) |
| [0003](0003-notificar-o-time-por-email-por-evento.md) | Notificar o time por e-mail por evento | Aceita | [Feedback e comunicação](../sdd/feedback-e-comunicacao.md) |
| [0004](0004-provider-unico-de-feedback-com-reducer.md) | Estado de feedback em um provider único com reducer | Aceita | [Feedback e comunicação](../sdd/feedback-e-comunicacao.md) |
| [0005](0005-regras-de-negocio-validadas-no-service.md) | Regras de negócio validadas no service, handler fino | Aceita | [Feedback e comunicação](../sdd/feedback-e-comunicacao.md) |
| [0006](0006-um-reporte-por-usuario-por-questao-com-reabertura.md) | Um reporte por usuário por questão, com reabertura | Aceita | [Feedback e comunicação](../sdd/feedback-e-comunicacao.md) |
| [0007](0007-moderacao-de-questoes-adiada.md) | Moderação de questões adiada: a Fase 1 não altera `ExamQuestion` | Aceita (com decisão pendente) | [Feedback e comunicação](../sdd/feedback-e-comunicacao.md) |

## Status possíveis

`Proposta` · `Aceita` · `Rejeitada` · `Substituída por ADR-NNNN` · `Obsoleta`

## Como adicionar uma ADR

1. Próximo número sequencial de 4 dígitos, nunca reutilizado: `docs/adr/NNNN-slug-em-kebab-case.md`.
2. Copiar a estrutura de qualquer ADR existente: **Contexto → Decisão → Alternativas → Consequências → Revisitar
   quando**.
3. Adicionar a linha na tabela acima.
4. `git add -f` não é necessário: `docs/adr/` é exceção no `.gitignore` (ver ADR-0001).
