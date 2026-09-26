# Roadmap — Lista de Exames

> Última atualização: 2026-09-26 · Tópico: a página `/exams` (Meus exames) e o que cada card ajuda o usuário a
> decidir.
>
> **Design e decisões:** [SDD](../sdd/lista-de-exames.md) (regras `RN-xx`, contratos, decisões `D-xx`).

## Índice

- [Status geral](#status-geral)
- [P1 — Preparo como nota projetada](#p1--preparo-como-nota-projetada)
- [Riscos abertos](#riscos-abertos)

---

## Status geral

| Frente | Esforço | Status | Progresso |
|---|---|---|---|
| P1 — Preparo como nota projetada | M | Implementado, aguardando aceite (PR #103) | 10/11 |
| Riscos abertos | — | Em aberto | 0/3 |

---

## P1 — Preparo como nota projetada

**Status:** Implementado, aguardando aceite · **Branch:** `fix/exam-readiness`

A barra PREPARO ficava em 0% na maioria dos exames: media cobertura por tópico, mas as questões são salvas por
domínio. O diagnóstico completo está no [SDD](../sdd/lista-de-exames.md#objetivo-e-escopo).

### Checklist

- [x] **1.1** `computeExamReadiness` reescrita: nota projetada por peso do edital, janela de 30 respostas, fases
  (RN-01 a RN-06)
- [x] **1.2** `ExamService.getExams` busca as respostas de simulado e devolve `Exam.readiness`
- [x] **1.3** `DashboardService` usa o mesmo cálculo e devolve `passingScore` (RN-10)
- [x] **1.4** Ordenação "Preparo" da lista pelo comparador compartilhado (RN-09)
- [x] **1.5** Bloco PREPARO do card com as quatro fases, marcador na nota de corte e link de ação (RN-07, RN-08)
- [x] **1.6** Painel de domínios mostra acerto e banco coberto por domínio, no lugar do peso do edital
- [x] **1.7** Linha do dashboard com as mesmas fases
- [x] **1.8** i18n PT/EN (14 chaves novas no card, 2 no dashboard; 2 chaves mortas removidas)
- [x] **1.9** Testes unitários e E2E citando as RN; verificação visual nos temas claro e escuro
- [x] **1.10** Ajustes da revisão do PR #103: preparo e simulado oficial com a mesma distribuição pelo `maxQuestions`
  (D-09); questões sem `sectionId` casadas pelo nome (D-10); nota com corte decimal, domínio sem peso, barra do banco,
  marcador centrado e "sem domínios" no dashboard. Preparo velho entre páginas não se confirmou: o provider é por
  página, e um E2E passa a proteger isso
- [ ] **1.11** Aceite do Guilherme e merge

---

## Riscos abertos

- [ ] **"Precisão" e "Preparo" lado a lado podem confundir.** O card mostra o acerto médio dos simulados (ex.: 64%)
  e o preparo projetado (ex.: 54%). A nota abaixo da barra explica a diferença (domínio não testado conta como 0),
  mas vale observar com usuários reais ([D-07](../sdd/lista-de-exames.md#decisões-de-design)).
- [ ] **`getExams` traz todo o histórico de respostas.** O cálculo usa no máximo 30 respostas por domínio, mas a
  consulta traz todas as de simulados finalizados, e roda a cada abertura de `/exams`. Limitar por domínio exige SQL
  cru com window function ([SDD](../sdd/lista-de-exames.md#backend)).
- [ ] **Prática fora de simulado não conta.** Quem só estuda pelo banco de questões fica em "Pronto para medir" até
  fazer um simulado, porque essas respostas não são persistidas ([Q-02](../sdd/lista-de-exames.md#questões-em-aberto)).
