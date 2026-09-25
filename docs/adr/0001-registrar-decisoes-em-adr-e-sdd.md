# ADR-0001 — Registrar decisões e regras de negócio em ADRs e SDDs

- **Status:** Aceita
- **Data:** 2026-09-25
- **Proposta por:** Claude (Solution Architect) · **Solicitada por:** Guilherme Holanda
- **Relacionadas:** [roadmap de feedback e comunicação](../roadmap/feedback-e-comunicacao.md)

## Contexto

As decisões do projeto vivem espalhadas: em conversas com assistentes de IA, em planos de implementação por
feature (`docs/superpowers/`, em sua maioria ignorados pelo git) e em `CLAUDE.md`. Isso já produziu divergências
verificáveis: `CLAUDE.md` manda usar escapes unicode nos `.properties` (o arquivo usa acento literal em 792
linhas contra 23 com escape), cita `FullExamJob` (hoje `GenerationJob`) e um cron de 30 min (hoje 10 min).

Sessões de IA e novas pessoas não carregam memória do que foi decidido nem do que foi descartado. O resultado é
retrabalho: decisões reabertas sem saber por que foram tomadas, e regras de negócio que só existem no código.

Há também um obstáculo mecânico: `.gitignore` contém `/docs`, então um arquivo **novo** em `docs/` é ignorado
em silêncio e nunca chega ao repositório.

## Decisão

Três tipos de documento, com papéis que não se sobrepõem:

| Documento | Responde | Onde | Ciclo de vida |
|---|---|---|---|
| **Roadmap** | O quê, em que ordem, em que estado | `docs/roadmap/<topico>.md` | Vivo — checkboxes atualizados a cada tarefa |
| **ADR** | Por que decidimos assim, o que descartamos | `docs/adr/NNNN-slug.md` | Imutável depois de aceita |
| **SDD** (design doc) | Como funciona e quais são as regras de negócio | `docs/sdd/<topico>.md` | Vivo — atualizado no **mesmo PR** que muda o comportamento |

Regras:

1. **Uma decisão por ADR.** Numeração sequencial de 4 dígitos, nunca reutilizada. Estrutura fixa: Contexto,
   Decisão, Alternativas, Consequências, Revisitar quando.
2. **ADR aceita não se edita** (exceto o campo Status e links). Para mudar uma decisão, escreve-se uma ADR nova
   que a substitui e a antiga passa a `Substituída por ADR-NNNN`. O histórico é o valor.
3. **Quando escrever ADR:** a decisão é difícil de reverter, teve alternativas reais **e** atravessa mais de um
   módulo. Convenções que já estão em `CLAUDE.md` não viram ADR.
4. **Um SDD por tópico**, no mesmo padrão do roadmap (um arquivo por tópico, não por feature). Contém as regras de
   negócio com **IDs estáveis** (`RN-01`, `RN-02`…), contratos de API, modelo de dados e a matriz de testes.
   Testes citam o ID da regra no título (`it('RN-11: …')`). O ID nunca é renumerado; uma regra removida vira
   `RN-nn (removida)`.
5. **Idioma:** português do Brasil, com acentuação.
6. **Versionamento:** `docs/roadmap/`, `docs/adr/` e `docs/sdd/` são exceções no `.gitignore`
   (`/docs` → `/docs/*` + `!/docs/roadmap/`, `!/docs/adr/`, `!/docs/sdd/`), para que arquivos novos deixem de
   sumir. O resto de `docs/` continua ignorado como antes.
7. **Descoberta:** `CLAUDE.md` aponta para `docs/adr/` e `docs/sdd/`, para que qualquer sessão saiba onde
   procurar antes de mudar algo já decidido.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Tudo em `CLAUDE.md` | Já é o arquivo mais longo do projeto (~300 linhas) e é lido em toda sessão; decisões e regras por tópico o inflariam e ele já está desatualizado em pontos |
| Continuar com specs por feature em `docs/superpowers/specs/` | Um doc por feature, sem status nem noção de "substituída", e majoritariamente fora do git |
| Wiki/Notion externo | Vive longe do código, não passa por revisão de PR e assistentes de IA não o leem por padrão |
| Só comentários no código | O `CLAUDE.md` proíbe comentários que expliquem o quê/porquê da tarefa; e regra de negócio espalhada em comentários não é auditável |

## Consequências

**Positivas**
- Decisões e regras de negócio versionadas junto com o código, revisáveis em PR.
- Uma regra tem um ID: dá para apontar do teste para a regra e da regra para a decisão.

**Custos**
- Manter SDD e ADRs exige disciplina; documentação desatualizada é pior que nenhuma.
- Mitigação: o SDD é atualizado no mesmo PR que muda o comportamento, e a ADR nunca é editada — só substituída.

**Risco residual**
- A alteração do `.gitignore` muda o status de `docs/roadmap/`, `docs/adr/` e `docs/sdd/` para "rastreado por
  padrão". Nenhum arquivo já existente em `docs/` muda de estado.

## Revisitar quando

- Houver mais de ~30 ADRs e a tabela do índice deixar de ser navegável (avaliar agrupar por tópico).
- O projeto passar a ter mais de uma pessoa revisando decisões (avaliar um campo formal de "Decisores").
