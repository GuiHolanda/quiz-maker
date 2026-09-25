# Architecture Decision Records (ADRs)

Registro das decisões **arquiteturais** do CertifiqueAI: por que algo foi decidido, o que foi descartado e o que
isso custa.

## Três documentos, três papéis

| Documento | Responde | Onde | Ciclo de vida |
|---|---|---|---|
| **Roadmap** | O quê, em que ordem, em que estado | `docs/roadmap/<topico>.md` | Vivo: checkboxes atualizados a cada tarefa |
| **ADR** | Por que decidimos assim, o que descartamos | `docs/adr/NNNN-slug.md` | Imutável depois de aceita |
| **SDD** (design doc) | Como funciona e quais são as regras de negócio | `docs/sdd/<topico>.md` | Vivo: atualizado no **mesmo PR** que muda o comportamento |

Roadmap e SDD são **um arquivo por tópico**, não por feature. ADR é um arquivo por decisão.

## Quando escrever uma ADR

Só quando as **três** coisas forem verdade:

1. A decisão é **difícil de reverter** (schema com dados, contrato externo, integração).
2. Teve **alternativas reais**.
3. **Atravessa mais de um módulo.**

O que **não** vira ADR:

| É... | Vai para |
|---|---|
| Convenção que já está no [CLAUDE.md](../../CLAUDE.md) | Fica no `CLAUDE.md` |
| Regra de negócio | SDD, como `RN-xx` |
| Decisão pequena, com porquê e alternativas | SDD, tabela "Decisões de design" (`D-xx`) |
| Escopo cortado ou decisão ainda em aberto | Roadmap ("Riscos abertos") e SDD ("Questões em aberto", `Q-xx`) |

Na primeira rodada foram escritas 7 ADRs para o tópico de feedback e 5 foram cortadas por não passarem nesse
critério; o porquê delas está no SDD.

## Regras

1. **Numeração** sequencial de 4 dígitos, nunca reutilizada: `NNNN-slug-em-kebab-case.md`.
2. **Estrutura fixa:** Contexto, Decisão, Alternativas consideradas, Consequências, Revisitar quando.
3. **ADR aceita não se edita** (só o Status e links). Para mudar uma decisão, escreve-se uma ADR nova que a
   substitui, e a antiga passa a `Substituída por ADR-NNNN`. O histórico é o valor.
4. **Idioma:** português do Brasil, com acentuação.
5. **Versionamento:** o `.gitignore` ignora `/docs/*`, com exceção de `docs/roadmap/`, `docs/adr/` e `docs/sdd/`.
   Arquivos novos nesses três diretórios são rastreados sem `git add -f`; o resto de `docs/` continua ignorado.
6. **SDD:** as regras de negócio têm **ids estáveis** (`RN-01`…), nunca renumerados; uma regra removida vira
   `RN-nn (removida)`. Testes citam o id no título (`it('RN-11: …')`).
7. **Descoberta:** o `CLAUDE.md` aponta para estes diretórios.

## Índice

| ADR | Título | Status | Tópico |
|---|---|---|---|
| [0001](0001-persistencia-de-feedback-sem-foreign-key.md) | Persistência de feedback em tabelas sem FK, com snapshot | Aceita | [Feedback e comunicação](../sdd/feedback-e-comunicacao.md) |
| [0002](0002-notificar-o-time-por-email-por-evento.md) | Notificar o time por e-mail por evento | Aceita | [Feedback e comunicação](../sdd/feedback-e-comunicacao.md) |

## Status possíveis

`Proposta` · `Aceita` · `Rejeitada` · `Substituída por ADR-NNNN` · `Obsoleta`

## Como adicionar uma ADR

1. Confirme que passa nos três critérios acima.
2. Próximo número sequencial; copie a estrutura de uma ADR existente.
3. Adicione a linha na tabela do índice.
