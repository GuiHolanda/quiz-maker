# Preço, Margem e Crescimento — auditoria dos tiers

**Data:** 21 ago 2026 · **Base:** código em `main` @ `4d148ee` · **15 achados**

Auditoria dos três tiers atuais contra o que o código realmente entrega, o ponto de
equilíbrio real por plano, e a viabilidade de indicação e comissionamento como canais
de aquisição.

---

## 1. O essencial

> **O modelo de preço atual só fecha porque ninguém usa a cota que comprou.** Com o custo
> de LLM embutido no produto, o plano Pro de R$ 19,80 empata em torno de **325 questões** —
> cerca de **22% da cota de 1.500** que ele vende. Qualquer assinante Pro razoavelmente
> engajado dá prejuízo. O Pro AI, com AI Chat sem teto, é pior.

Isso não é argumento contra promoções — é a razão pela qual a estrutura de tiers precisa
ser corrigida *antes* de qualquer campanha de aquisição. Todo programa de indicação e todo
cupom de afiliado despeja usuários dentro dessa economia. Se a unidade é negativa, crescer
acelera a perda.

Há também uma lacuna que bloqueia qualquer canal pago ou de parceiros hoje: **não existe
nenhuma instrumentação de funil** — sem GA, sem PostHog, sem captura de UTM no cadastro.
Não há como atribuir uma venda a um influenciador nem medir se a indicação funcionou.

**As cinco ações que mudam o jogo, em ordem:**

1. **Instrumentar antes de gastar.** Captura de UTM no registro e analytics de funil.
   Pré-requisito de tudo abaixo.
2. **Ligar `allow_promotion_codes` no checkout.** Uma linha. Destrava cupom de
   influenciador, campanha sazonal e win-back sem infraestrutura de atribuição própria.
3. **Corrigir as incoerências de vitrine** (achados 01–05). Há promessa em página pública
   que o código não cumpre — risco de CDC, não só de conversão.
4. **Reancorar a grade de preços** com trava de preço de fundador para os assinantes
   atuais, transformando o subpreço em campanha em vez de erro.
5. **Indicação dupla, com recompensa liberada só na ativação.** Barato, na marca, e o mais
   rápido de operar — depois que o passo 1 existir.

---

## 2. Vitrine × código

| Capacidade | Free | Pro · R$ 19,80 | Pro AI · R$ 39,80 | Aparece na /pricing? |
|---|---|---|---|---|
| Questões / período (30d corridos) | 250 | 1.500 | 2.500 | Sim |
| Exames simultâneos | 2 | 5 | 5 | Sim, como "customizados" |
| **Criar / editar exame** | **Não** | Sim | Sim | **Não — e a cópia sugere o contrário** |
| **Auto-config por IA / período** | 0 | 15 | 30 | **Não aparece em lugar nenhum** |
| AI Chat | — | — | Ilimitado | Sim |
| Simulados | Ilimitado | Ilimitado | Ilimitado | Sim |
| Suporte prioritário | — | — | ? | **Listado, sem implementação** |

Fontes: `config/constants/index.ts:76-80`,
`app/(marketing)/components/pricing/FeatureComparisonTable.tsx:16-34`,
`config/constants/index.ts:125`.

Duas assimetrias saltam. A capacidade que **mais** diferencia um plano pago — poder montar
seu próprio exame com o blueprint gerado por IA — está invisível na vitrine, enquanto a que
**menos** diferencia (contagem bruta de questões) ocupa a primeira linha de todas as
tabelas. E "Suporte prioritário" é vendido sem existir.

---

## 3. Incoerências

### Promessa pública que o produto não cumpre

**01 · O plano gratuito anuncia "exames customizados" que ele não pode customizar — CRÍTICO**

A tabela comparativa e a home vendem ao Free "2 exames customizados" / "2 certificações
customizadas". Mas `canEditExams('free')` é `false`: as rotas de criação, edição e
auto-config devolvem 403, e a UI mostra parede de upgrade. O usuário Free só pode *forkar*
um exame pronto do catálogo e usá-lo em modo leitura. É publicidade de uma capacidade
inexistente — exposição de CDC art. 30/37, além do custo de confiança de descobrir isso
depois do cadastro.

`config/constants/index.ts:76` · `app/api/exam/save-exam/route.ts:18` · `pt.properties:1096,1518,1540`

*Correção:* escolher um lado — renomear para "exames do catálogo" em toda a cópia, **ou**
(recomendado) liberar 1 exame próprio no Free (ver §5).

**02 · A demo em português promete 100 questões; o plano entrega 250 — ALTO**

Dois textos da demo estão com número fixo e desatualizado, enquanto a home e a /pricing
interpolam `PLAN_LIMITS.free.questionsPerPeriod` corretamente. Pior: a versão em inglês do
mesmo fluxo já diz 250. O visitante que compara as duas telas vê a plataforma se
contradizer no momento exato da decisão de cadastro.

`pt.properties:1639,1695` · `en.properties:1700`

*Correção:* trocar o literal por `{free}` e interpolar, como já é feito em
`HeroStaticContent.tsx:24`. Nenhum número de plano deveria estar escrito à mão em
`.properties`.

**03 · "Suporte prioritário" é vendido e não existe — ALTO**

Aparece como linha exclusiva do Pro AI no card e na tabela. Não há canal separado, fila,
nem SLA no código ou na operação — e o FAQ da mesma página promete "até um dia útil" para
todo mundo, o que anula a exclusividade dentro da própria página.

`FeatureComparisonTable.tsx:33` · `PricingCardList.tsx:52` · `pt.properties:1112`

*Correção:* remover a linha até existir SLA, ou definir um de verdade (ex.: resposta em 4h
úteis para Pro AI) e publicá-lo. Um diferencial vazio contamina a credibilidade dos que são
reais.

**04 · O plano anual nunca mostra o preço total — ALTO**

O card exibe "R$ 14,85 /mês · cobrado anualmente". O valor efetivamente debitado —
R$ 178,20 no Pro, R$ 358,20 no Pro AI — não aparece em nenhum lugar antes do Stripe. Além
do atrito de conversão, o CDC exige preço total à vista de forma clara.

`PricingCardList.tsx:120-140` · `pt.properties:1083,1085,1088`

*Correção:* subtítulo com "R$ 178,20 cobrados uma vez por ano · economia de R$ 59,40".
Mostrar a economia em reais converte melhor que "25%".

**05 · "Por mês", "por período" e "30 dias após a primeira geração" descrevem a mesma coisa de três jeitos — nenhum correto — MÉDIO**

O mecanismo real é uma janela corrida de 30 dias contada a partir de `periodStartDate`, que
nasce na *criação da conta* e se renova sozinha. Não é mês-calendário e não começa na
primeira geração, como afirma o FAQ. É a origem clássica de ticket "meu limite não zerou no
dia 1º".

`quota.service.ts:20-33` · `pt.properties:1095,1116,1540`

*Correção:* padronizar "a cada 30 dias" em toda a cópia e mostrar a data da próxima
renovação no badge de uso e na tela de billing.

### Estrutura de valor entre os tiers

**06 · O degrau Pro → Pro AI dobra o preço para entregar 67% mais do item errado — CRÍTICO**

R$ 19,80 → R$ 39,80 é +101%. A contrapartida visível é 1.500 → 2.500 questões (+67%) mais o
AI Chat. Mas quem está encostando no teto de 1.500 questões é justamente o usuário mais
engajado — e mais caro. O upgrade está ancorado no eixo que destrói margem, não no que gera
valor percebido.

`config/constants/index.ts:77-78` · `pt.properties:1082,1084`

*Correção:* ancorar o Pro AI em capacidade (auto-configs, exames simultâneos, chat) e
manter a diferença de volume modesta. Volume deve ser a última linha do card, não a
primeira.

**07 · A cota de auto-config é o diferencial mais caro do produto e não é vendida — ALTO**

15/período no Pro contra 30 no Pro AI, com o Free zerado. É o recurso que materializa a
promessa da marca — a IA monta o blueprint do seu exame — e o mais custoso de servir. Não
aparece no card, na tabela comparativa nem no FAQ. O usuário só descobre que existe quando
bate no limite.

`config/constants/index.ts:76-78` · `quota.service.ts:127-176`

*Correção:* promover a linha "Exames montados pela IA" para o topo dos cards, acima de
questões.

**08 · Pro e Pro AI têm o mesmo teto de exames — MÉDIO**

Ambos param em 5. Para um concurseiro que acompanha três editais ao mesmo tempo, ou um
profissional empilhando certificações, esse é o limite que dói de verdade — e é o eixo com
melhor correlação entre disposição a pagar e seriedade do candidato. Está achatado.

`config/constants/index.ts:77-78`

*Correção:* 3 / 6 / 12. Dá degrau real ao Pro AI num eixo de custo marginal quase zero.

**09 · O plano gratuito prova a coisa errada — ALTO**

250 questões é generoso em volume e mudo em capacidade: o Free não cria exame, não roda
auto-config e não usa o chat. Ele experimenta um banco de questões genérico — exatamente a
categoria da qual o posicionamento diz se diferenciar. E o FAQ declara que não há trial.
Resultado: o funil qualifica mal e o custo de servir o Free é alto para o sinal que ele
produz.

`pricing.faq.a3` · `config/constants/index.ts:76`

*Correção:* menos volume, mais capacidade — cortar para ~100 questões e liberar 1 exame
próprio + 1 auto-config. Custo de servir cai e o Free passa a demonstrar o produto real.

### Mecânica de cota e cobrança

**10 · `customQuotaOverride` substitui o limite do plano em vez de somar — e isso bloqueia qualquer bônus — CRÍTICO**

`resolveQuestionsLimit` devolve o override e ignora o plano. Conceder 300 questões a um
usuário Free e depois vê-lo assinar o Pro resulta num assinante pagante travado em 300 em
vez de 1.500, silenciosamente, até ele reclamar. É o único campo hoje disponível para
conceder bônus — ou seja, **a promoção "indique e ganhe" não tem onde escrever** sem
quebrar upgrades.

`quota.service.ts:41-46`

*Correção:* campo aditivo separado — `bonusQuestions`, consumido depois da cota do período e
nunca zerado na virada. Exige migração de schema, que o CLAUDE.md manda aprovar antes.

**11 · Fazer upgrade não zera o contador do período — ALTO**

O webhook `checkout.session.completed` troca o plano e não toca em
`questionsGeneratedThisPeriod` nem em `periodStartDate`. Quem esgota as 250 do Free no dia
27 e assina o Pro recebe 1.250 — não 1.500 — e vê tudo renovar três dias depois. O pior
momento possível para uma surpresa negativa é o minuto seguinte ao pagamento.

`app/api/webhooks/stripe/route.ts:47-59`

*Correção:* zerar o contador e reiniciar o período no upgrade. Alinhar a janela ao ciclo de
cobrança do Stripe resolve os achados 05 e 11 de uma vez.

**12 · Cancelar zera o contador — cancelar e reassinar recicla a cota — MÉDIO**

Em `customer.subscription.deleted` o consumo do período volta a zero. Combinado com o achado
11, cancelar e reassinar rende cota nova. Hoje é irrelevante pelo volume; vira exploit assim
que houver escala, e é dinheiro deixado na mesa por outro motivo — o cancelamento é o melhor
gatilho de win-back que existe e não dispara nada.

`app/api/webhooks/stripe/route.ts:83`

*Correção:* preservar o consumo até a virada natural do período e disparar e-mail de
win-back com oferta de retorno.

**13 · O checkout não aceita cupom — CRÍTICO**

`checkoutParams` não define `allow_promotion_codes`. Sem isso não existe cupom de
influenciador, campanha de Black Friday, oferta de win-back nem preço promocional de
lançamento. É o menor diff do documento e o que mais destrava — o Stripe já traz criação de
código, limite de uso, validade e relatório de resgate prontos.

`app/api/billing/checkout/route.ts:37-44`

*Correção:* `allow_promotion_codes: true`. Uma linha.

### Visibilidade de custo

**14 · Duas rotas de LLM não passam por cota nem por métrica — CRÍTICO**

A geração de explicações por alternativa e o preenchimento de respostas do simulado chamam o
modelo sem `QuotaService` e sem `MetricsService`. Não descontam nada do usuário e —
decisivo aqui — **não escrevem em `UsageLogStep`**. A tabela "Margem por Plano" do admin lê
exatamente essa tabela, então o custo real é maior que o exibido, e é maior de forma desigual
entre planos: quem lê mais explicações some mais da conta. As explicações são cacheadas
depois da primeira leitura, o que limita o dano, mas não o corrige.

`app/api/exam/questions/[questionId]/explanation/route.ts:48-67` ·
`app/api/mock-exams/mock-exam.service.ts:325-355` · `app/admin/analytics/page.tsx:266-280`

*Correção:* instrumentar as duas com `MetricsService` antes de tomar qualquer decisão de
preço. Sem isso, o número de margem no admin não é confiável.

**15 · O modelo de custo ignora as chamadas de busca web e o AI Chat não tem teto — ALTO**

`ACTIVE_MODEL_PRICING_USD` só contabiliza tokens. A etapa de research roda com
`tool_choice: 'required'` em busca web, cobrada por chamada à parte — invisível no painel. E
o AI Chat, único diferencial que sustenta o dobro de preço do Pro AI, é ilimitado em volume:
tem métrica, não tem cota. Um punhado de usuários intensos derruba a margem do tier inteiro.

`config/constants/index.ts:96-99` · `openAI.service.ts:45` · `AI_CHAT_ALLOWED_PLANS`

*Correção:* somar a tarifa de busca ao modelo de custo e colocar teto mensal de mensagens no
chat — generoso o bastante para ninguém normal encostar, baixo o bastante para limitar a
cauda.

---

## 4. Onde a conta empata

O pipeline de geração faz três chamadas por lote de tópico — research com busca web, review
e format. Aplicando o modelo de custo do próprio projeto (US$ 0,75/M entrada, US$ 4,50/M
saída, câmbio 5,7) a um lote típico de 10 questões, com o encadeamento em que a saída de
cada etapa vira entrada da seguinte:

| Componente | Entrada | Saída | Custo / questão | Medido hoje? |
|---|---|---|---|---|
| Geração (research + review + format) | ~12,5k | ~12k | R$ 0,036 | Sim |
| Explicações por alternativa | ~1k | ~0,8k | R$ 0,025 | **Não** |
| Respostas de simulado | — | — | ~R$ 0,010 | **Não** |
| Chamadas de busca web | tarifa por chamada | | não modelado | **Não** |
| **Total realista** | | | **≈ R$ 0,061 +** | |

> Estimativa com premissas explícitas de tokens — os valores reais estão a um query de
> distância em `/admin/analytics`, exceto pelas linhas não medidas do achado 14, que
> precisam ser instrumentadas primeiro. A conclusão estrutural abaixo é robusta a erro de
> ±40% nas premissas.

| Plano | Receita/mês | Custo a 100% da cota | Margem a 100% | Empata em | % da cota vendida |
|---|---|---|---|---|---|
| Free · 250q | R$ 0,00 | R$ 15,25 | −R$ 15,25 | — | — |
| Pro · 1.500q | R$ 19,80 | R$ 91,50 | −R$ 71,70 | 325 questões | **21,6%** |
| Pro AI · 2.500q | R$ 39,80 | R$ 152,50 | −R$ 112,70 | 652 questões | **26,1%** |

Pro AI sem contar o AI Chat, que é ilimitado. Um usuário Free que esgota a cota custa quase
o preço de um assinante Pro.

A leitura correta não é "o produto dá prejuízo" — é **"a rentabilidade depende inteiramente
de *breakage*"**, o consumo abaixo da cota vendida. Utilização típica em SaaS por cota fica
entre 20% e 40%, o que coloca o Pro em cima da linha e não acima dela. Três consequências:

- **Todo ganho de engajamento é uma perda de margem** na estrutura atual. É o incentivo
  invertido: o produto lucra quando o usuário não estuda.
- **Cotas altas não são um bom argumento de venda aqui** — são um passivo com aparência de
  benefício. Vender capacidade (montar exames, auto-config, chat) em vez de volume alinha
  preço e custo.
- **Antes de escalar aquisição**, a distribuição real de consumo por percentil precisa sair
  de `/admin/analytics`. Se o p90 dos Pro passa de 325 questões, o problema é agora.

---

## 5. Grade proposta

Referência de mercado no segmento de concursos: QConcursos e TEC Concursos começam por volta
de R$ 30/mês e o Gran Questões fica em R$ 59,90 — com promoções sazonais puxando para
R$ 19,90. Ou seja, **R$ 19,80 não é o preço de entrada do mercado: é o preço de promoção do
mercado**, cobrado o ano inteiro. Num segmento sem prova social ainda montada, preço baixo
demais também comunica qualidade baixa.

| | Free | Pro | Pro AI | Sprint (novo) |
|---|---|---|---|---|
| **Preço** | R$ 0 | R$ 29,90/mês | R$ 49,90/mês | R$ 89,90 / 3 meses |
| Questões / 30d | 100 | 1.000 | 2.000 | — (tudo do Pro AI) |
| Exames simultâneos | 1 próprio | 6 | 12 | 12 |
| Auto-config | 1 | 15 | 30 | 30 |
| AI Chat | — | — | teto 300 msg/mês | teto 300 msg/mês |
| *Antes* | *250q, 2 exames, 0 auto-config* | *R$ 19,80 · 1.500q · 5 exames* | *R$ 39,80 · 2.500q · 5 exames* | *não existe* |

Três movimentos e a razão de cada um:

- **Preço sobe, cota desce.** Pro vai a R$ 29,90 com 1.000 questões: o ponto de equilíbrio
  sai de 22% para 49% da cota vendida, dentro da faixa de utilização normal. Chegar ao preço
  de entrada do mercado também para de sinalizar produto de segunda linha.
- **Trava de fundador.** Quem já assina — e os próximos 200 — mantém R$ 19,80 travado
  enquanto a assinatura estiver ativa. Isso transforma o subpreço atual em campanha ("preço
  de fundador, encerra em X vagas"), cria urgência real, protege a base de churn por
  reajuste e produz a coorte de onde sairão os primeiros depoimentos que o PRODUCT.md
  registra como inexistentes.
- **Plano Sprint.** Concurseiro não compra assinatura por tempo indeterminado; compra até a
  data da prova. Um plano de 90 dias pago à vista casa com a intenção real, adianta caixa e
  elimina a decisão mensal de cancelamento. O mesmo vale para quem marcou a data da
  certificação.

**Risco a monitorar:** subir preço sem prova social é o movimento mais arriscado do
documento. Por isso ele vem depois da instrumentação, e por isso a trava de fundador existe —
ela permite testar o preço novo em coortes novas sem tocar em quem já confiou no produto.

---

## 6. Indicação ("indique um amigo e ganhe 50 questões")

**Veredito: viável, barato e o programa certo para começar — mas não com "50 questões", e
não antes do achado 10 ser resolvido.**

### A economia funciona

Cinquenta questões custam **≈ R$ 3,05** de COGS real. Numa recompensa de mão dupla — quem
indica e quem entra recebem — o par sai por **≈ R$ 6,10**. Isso é uma ordem de grandeza
abaixo de qualquer canal pago para trazer um cadastro, e o pagamento acontece em capacidade
ociosa do produto, não em caixa. A conta fecha com folga.

### Três coisas que precisam mudar no desenho

**A recompensa precisa ser de mão dupla.** "Indique um amigo e ganhe 50 questões" dá motivo
para o indicador enviar e nenhum para o amigo aceitar. O convite tem que carregar valor para
quem recebe — é o que transforma um pedido de favor em uma oferta.

**50 questões é fraco demais para mover comportamento.** É 20% da cota gratuita, algo como
uma sessão de estudo. Recompensa precisa ser contada em unidade que o usuário reconhece:
"+2 simulados completos" comunica muito mais que "+100 questões", e custa o mesmo. Sugestão
de calibragem: **+150 questões para quem indica, +100 para quem entra** — cerca de R$ 15 de
COGS por par ativado, ainda irrisório.

**A recompensa só pode liberar na ativação, nunca no cadastro.** Sem trava, vinte e-mails
descartáveis viram mil questões grátis. O gatilho deve ser: e-mail verificado *e* primeiro
conjunto de questões gerado *ou* primeiro simulado concluído. Isso alinha o prêmio ao único
evento que importa — o amigo virou usuário de verdade — e serve de filtro antifraude
natural. Teto de 10 indicações por conta.

### O que precisa existir

- **Campo aditivo de bônus.** `customQuotaOverride` substitui o limite do plano (achado 10)
  e não serve. Precisa de `bonusQuestions`, somado à cota e nunca zerado na virada do
  período. É migração de schema — o CLAUDE.md exige aprovação explícita.
- **Código de indicação e atribuição no cadastro.** Não existe nada disso hoje; o registro
  nem captura UTM.
- **Modelo de evento de indicação** com estado (pendente → ativado → pago) para auditar e
  travar duplicidade.
- **Gatilho de e-mail** — o `EmailService` já roda em Resend com template pronto, então esta
  parte é barata.

> **Variante sem migração de schema:** se a mudança de schema precisar esperar, recompensar
> com **cupom Stripe** em vez de questões. Quem indica ganha R$ 10 de desconto na próxima
> fatura quando o amigo assina. Custa caixa apenas sobre cliente pagante, usa a
> infraestrutura de `allow_promotion_codes` do achado 13 e não toca no banco. É mais fraco
> para ativar usuário Free, mas entra no ar em dias em vez de semanas.

---

## 7. Cursinhos e influenciadores

**Veredito: viável, mas não como comissão recorrente — e não como um programa só.** São dois
públicos com economias opostas empacotados na mesma pergunta.

### A restrição que define tudo

Programas de afiliado de infoproduto pagam 30–60% porque vendem PDF e vídeo gravado, com
margem próxima de 100% e entrega de custo zero. Aqui cada assinante carrega COGS de LLM
recorrente. Com o Pro empatando perto de 22% da cota, **não existe espaço para comissão
recorrente vitalícia** — ela consome a margem que ainda nem existe. A referência do próprio
segmento confirma a ordem de grandeza: o programa do Implacável Concursos paga 10%, não 40%.

### Influenciadores — cupom, não link

Atribuição por link exige rastreamento próprio, cookies, janela de conversão e reconciliação.
**Atribuição por cupom não exige nada disso**: cada creator recebe um código no Stripe, o
aluno digita no checkout, e o relatório de resgate vem pronto no painel. Isso já existe — só
falta a linha do achado 13.

Modelo recomendado: **CPA fixo por conversão que sobrevive 30 dias**, não percentual
recorrente. Algo como R$ 25 por assinante Pro e R$ 40 por Pro AI, pago no fechamento mensal.
É previsível para os dois lados, imune a chargeback e a churn de primeiro mês, e mantém o
custo de aquisição abaixo de um mês e meio de receita — recuperável se o LTV passar de três
meses, número que hoje ninguém sabe porque não há coorte medida.

**Cuidado de posicionamento:** cupom de desconto permanente ensina o mercado a nunca pagar
cheio, e o segmento de concursos já é viciado nisso. Prefira código que dê *primeiro mês com
desconto* ou *bônus de questões*, preservando o preço de tabela.

### Cursinhos — isso não é afiliação, é atacado

Tratar cursinho como afiliado é subaproveitar o ativo. Um cursinho não quer 10% sobre a venda
de um aluno: quer um diferencial para vender o próprio curso. O formato certo é **B2B2C por
lote** — licenças com desconto de volume (na ordem de R$ 9,90 por aluno/mês a partir de 100
assentos), que o cursinho embute no preço do curso e revende como benefício exclusivo.

Por que é a maior oportunidade do documento: CAC efetivamente zero, receita contratada e
previsível, cobrança concentrada num CNPJ em vez de mil cartões, e um canal que a
concorrência de banco de questões não ocupa bem. Por que é o mais caro de construir: exige
conta de organização, provisionamento e ativação em massa, faturamento fora do self-serve do
Stripe, e um ciclo de venda consultivo que não é o modo de operação atual.

**Recomendação:** não construir a plataforma. Fechar *um* piloto manual — um cursinho,
cinquenta alunos, licenças provisionadas na mão pelo admin (que já permite alterar plano e
cota por usuário), contrato de três meses. Se o piloto renovar, aí sim vale automatizar.

---

## 8. Outras alavancas, ranqueadas

Ordenado por impacto sobre esforço. As três primeiras entregam mais que indicação e
afiliados juntos no primeiro trimestre.

| Alavanca | Impacto | Esforço |
|---|---|---|
| **Instrumentação de funil e captura de UTM** — pré-requisito de tudo; sem isso nenhum canal é mensurável e nenhuma decisão de preço é verificável | Alto | Baixo |
| **Cupom no checkout** — uma linha destrava influenciador, sazonal, win-back e preço de lançamento | Alto | Mínimo |
| **SEO programático por exame** — as landing pages `/simulado/[exam-slug]` e a demo pública já existem; uma página por certificação e por edital é o único canal que compõe ao longo do tempo | Alto | Médio |
| **Bônus de ativação nas primeiras 48h** — "complete seu primeiro simulado em 48h e ganhe +100 questões"; ataca o momento de maior evasão e custa centavos | Alto | Médio |
| **Trial de 7 dias do Pro AI** — o FAQ anuncia que não há trial; a magia do produto está no que o Free não pode tocar. Trial converte melhor que cota gratuita generosa, e custa menos | Alto | Médio |
| **Win-back no cancelamento** — o webhook já roda e hoje só zera contador; anexar oferta de retorno é trabalho de horas | Médio | Baixo |
| **Plano de grupo (2–5 pessoas)** — concurseiro estuda em grupo; preço por assento usa a rede social que já existe em volta do usuário | Médio | Médio |
| **Programa de aprovados** — quem passa vira o ativo de marketing mais valioso do segmento e resolve o "prova social: nenhuma ainda" do PRODUCT.md | Médio | Baixo |
| **B2B corporativo** — empresas pagam certificação de time em nuvem e segurança; ticket muito maior, ciclo muito mais longo. Depois do piloto de cursinho, não antes | Alto | Alto |

---

## 9. Sequência sugerida

| Janela | Entregas | Por que nesta ordem |
|---|---|---|
| Semana 1 | `allow_promotion_codes` · corrigir cópia dos achados 01–05 · captura de UTM no cadastro | Risco legal e de confiança primeiro; o resto é o menor diff com maior destravamento |
| Semanas 2–3 | Instrumentar as duas rotas de LLM sem métrica · analytics de funil · extrair distribuição real de consumo por percentil | Nenhuma decisão de preço é confiável enquanto o painel de margem estiver incompleto |
| Semanas 4–6 | Nova grade com trava de fundador · plano Sprint · teto no AI Chat · auto-config promovida nos cards | Corrigir a unidade econômica antes de despejar volume dentro dela |
| Semanas 7–9 | Indicação de mão dupla com `bonusQuestions` e liberação na ativação · bônus de 48h | Depende da migração de schema e da atribuição da semana 1 |
| Semanas 10–12 | Cupons de influenciador com CPA fixo · piloto manual com um cursinho | Canais de parceiro só depois que a coorte própria comprovar retenção e LTV |

> **O número que decide tudo:** antes da semana 4, extrair de `/admin/analytics` a
> **distribuição de consumo de questões por percentil dentro de cada plano**. Se o p90 dos
> assinantes Pro estiver acima de 325 questões por período, a correção de grade vira urgente
> e não pode esperar a semana 4. Se estiver bem abaixo, há folga para priorizar aquisição
> primeiro — e a discussão inteira de preço muda de tom.

---

## Notas de método

Os custos por questão são estimativas com premissas de token declaradas na §4; os valores
auditáveis estão no painel administrativo, ressalvado o achado 14. Referências de mercado
coletadas em ago/2026 e não verificadas diretamente na página dos concorrentes (egress
bloqueado): [Gabaritei](https://gabaritei.com.br/melhores-plataformas-concursos),
[Guia dos Cursos](https://guiadoscursos.com/gran-cursos-online-vs-tec-concursos-2026-comparativo-plataformas-concursos-publicos/),
[Implacável Concursos](https://implacavelconcursos.com.br/programa-de-afiliados-implacavel-concursos/),
[Estratégia Concursos](https://www.estrategiaconcursos.com.br/pagina/programa-de-afiliados/).
Confirmar os preços na fonte antes de usá-los em material público.

Nenhuma alteração de código foi feita — este documento é diagnóstico e recomendação.
