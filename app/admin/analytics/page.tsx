import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';

import { AdminService } from '@/app/api/admin/admin.service';
import type { UserPlan, AdminActionStats } from '@/shared/types';
import {
  ACTIVE_MODEL_PRICING_USD,
  USD_TO_BRL_FALLBACK,
  PLAN_PRICES_BRL_MONTHLY,
  PLAN_LIMITS,
} from '@/config/constants';

const adminService = new AdminService();

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 4,
});

const brl2Formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function computeCostBRL(inputTokens: number, outputTokens: number, usdToBrl: number): number {
  const usd =
    (inputTokens * ACTIVE_MODEL_PRICING_USD.inputPerMillion) / 1_000_000 +
    (outputTokens * ACTIVE_MODEL_PRICING_USD.outputPerMillion) / 1_000_000;
  return usd * usdToBrl;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const planLabels: Record<UserPlan, string> = {
  free: 'Free',
  pro: 'Pro',
  pro_ai: 'Pro AI',
  tester: 'Tester',
  admin: 'Admin',
};

const planColors: Record<UserPlan, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  free: 'default',
  pro: 'primary',
  pro_ai: 'secondary',
  tester: 'success',
  admin: 'warning',
};

const ACTION_LABELS: Record<string, string> = {
  generate_questions: 'Geração de Questões',
  extract_edital: 'Extração de Edital',
  ai_chat: 'AI Chat',
  create_exam: 'Criar Certificação',
};

const STEP_LABELS: Record<string, string> = {
  research: 'Research',
  review: 'Review',
  format: 'Format',
  extract: 'Extract',
  chat: 'Chat',
};

export default async function AdminAnalyticsPage() {
  const [overview, usersData, exchangeRate] = await Promise.all([
    adminService.getOverview().catch(() => null),
    adminService.listUsers({ page: 1, limit: 10 }).catch(() => null),
    fetch('https://economia.awesomeapi.com.br/last/USD-BRL', { next: { revalidate: 3600 } })
      .then((r) => r.json())
      .then((d) => {
        const rate = parseFloat(d?.USDBRL?.bid);
        return isNaN(rate) ? USD_TO_BRL_FALLBACK : rate;
      })
      .catch(() => USD_TO_BRL_FALLBACK),
  ]);

  const rateLabel = brl2Formatter.format(exchangeRate);

  return (
    <div>
      <h1 className="page-header-title text-foreground mb-2">Analytics</h1>
      <p className="text-sm text-default-500 mb-8">Consumo de tokens, custos e margens por plano</p>

      {overview && (
        <>
          {renderSectionLabel('Distribuição de Planos')}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
            {(Object.entries(overview.byPlan) as [UserPlan, number][]).map(([plan, count]) => {
              const pct = overview.totalUsers > 0 ? Math.round((count / overview.totalUsers) * 100) : 0;
              return (
                <div key={plan} className="bg-content1 border border-default-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Chip color={planColors[plan]} size="sm" variant="flat">
                      {planLabels[plan]}
                    </Chip>
                    <span className="text-2xl font-extrabold text-foreground">{count}</span>
                  </div>
                  <Progress color={planColors[plan]} value={pct} size="sm" />
                  <p className="text-xs text-default-400 mt-1">{pct}% do total</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {usersData && (
        <>
          {renderSectionLabel('Top 10 Usuários')}
          <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider bg-content2">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Questões no Período</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Total Tokens</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Avg/questão</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Custo Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Custo/questão</th>
                </tr>
              </thead>
              <tbody>
                {usersData.users
                  .sort((a, b) => b.questionsGeneratedThisPeriod - a.questionsGeneratedThisPeriod)
                  .map((user, i) => {
                    const totalTokens = user.totalInputTokens + user.totalOutputTokens;
                    const avgPerQ =
                      user.totalQuestionsGeneratedAllTime > 0
                        ? Math.round(totalTokens / user.totalQuestionsGeneratedAllTime)
                        : null;
                    const totalCostBRL = computeCostBRL(user.totalInputTokens, user.totalOutputTokens, exchangeRate);
                    const costPerQBRL =
                      user.totalQuestionsGeneratedAllTime > 0
                        ? totalCostBRL / user.totalQuestionsGeneratedAllTime
                        : null;
                    return (
                      <tr key={user.id} className="border-b border-divider last:border-0">
                        <td className="px-4 py-3 text-xs text-default-400">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground text-sm">{user.name ?? '—'}</p>
                          <p className="text-xs text-default-400">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Chip size="sm" variant="flat" color={planColors[user.plan]}>
                            {planLabels[user.plan]}
                          </Chip>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">
                          {user.questionsGeneratedThisPeriod}
                        </td>
                        <td className="px-4 py-3">
                          {totalTokens > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-semibold text-foreground">
                                {totalTokens.toLocaleString('pt-BR')}
                              </span>
                              <span className="text-xs text-default-400">
                                {user.totalInputTokens.toLocaleString('pt-BR')} in /{' '}
                                {user.totalOutputTokens.toLocaleString('pt-BR')} out
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-default-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-default-500">
                          {avgPerQ !== null ? (
                            avgPerQ.toLocaleString('pt-BR')
                          ) : (
                            <span className="text-default-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">
                          {totalTokens > 0 ? (
                            brlFormatter.format(totalCostBRL)
                          ) : (
                            <span className="text-xs text-default-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-default-500">
                          {costPerQBRL !== null ? (
                            brlFormatter.format(costPerQBRL)
                          ) : (
                            <span className="text-default-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {overview && (
        <>
          {renderSectionLabel('Consumo de Tokens')}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {renderKpiCard('Input Tokens (total)', overview.totalInputTokens.toLocaleString('pt-BR'))}
            {renderKpiCard('Output Tokens (total)', overview.totalOutputTokens.toLocaleString('pt-BR'))}
            {renderKpiCard(
              'Media tokens/questão',
              overview.avgTokensPerQuestion.toLocaleString('pt-BR'),
              `(${overview.totalInputTokens.toLocaleString('pt-BR')} in + ${overview.totalOutputTokens.toLocaleString('pt-BR')} out) / ${overview.totalQuestionsGenerated.toLocaleString('pt-BR')} q`
            )}
            {renderKpiCard(
              'Custo Total (BRL)',
              brlFormatter.format(computeCostBRL(overview.totalInputTokens, overview.totalOutputTokens, exchangeRate)),
              `Cotação: ${rateLabel}/USD`
            )}
            {renderKpiCard(
              'Custo Medio/questão',
              overview.totalQuestionsGenerated > 0
                ? brlFormatter.format(
                    computeCostBRL(overview.totalInputTokens, overview.totalOutputTokens, exchangeRate) /
                      overview.totalQuestionsGenerated
                  )
                : '—',
              `${ACTIVE_MODEL_PRICING_USD.inputPerMillion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/M in · ${ACTIVE_MODEL_PRICING_USD.outputPerMillion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/M out`
            )}
          </div>
        </>
      )}

      {overview && Object.keys(overview.tokensByAction).length > 0 && (
        <>
          {renderSectionLabel('Consumo por Ação e Etapa')}
          <div className="flex flex-col gap-4 mb-10">
            {Object.entries(overview.tokensByAction).map(([action, stats]) =>
              renderActionCard(action, stats, exchangeRate)
            )}
          </div>
        </>
      )}

      {overview && (
        <>
          {renderSectionLabel('Margem por Plano')}
          <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden mb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider bg-content2">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Usuários</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Receita est./mês *</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Custo Tokens</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Margem</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">% Margem</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Break-even</th>
                </tr>
              </thead>
              <tbody>
                {(['free', 'pro', 'pro_ai'] as UserPlan[]).map((plan) => {
                  const userCount = overview.byPlan[plan] ?? 0;
                  const planPrice = PLAN_PRICES_BRL_MONTHLY[plan] ?? 0;
                  const revenue = userCount * planPrice;
                  const tokens = overview.tokensByPlan[plan];
                  const tokenCost = computeCostBRL(tokens.inputTokens, tokens.outputTokens, exchangeRate);
                  const hasRevenue = planPrice > 0;
                  const margin = hasRevenue ? revenue - tokenCost : null;
                  const marginPct = margin !== null && revenue > 0 ? (margin / revenue) * 100 : null;
                  const avgCostPerQ = tokens.questionsGenerated > 0 ? tokenCost / tokens.questionsGenerated : null;
                  const breakEven =
                    avgCostPerQ !== null && avgCostPerQ > 0 && hasRevenue ? Math.floor(planPrice / avgCostPerQ) : null;
                  const marginColorClass =
                    margin === null ? '' : margin >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold';

                  return (
                    <tr key={plan} className="border-b border-divider last:border-0">
                      <td className="px-4 py-3">
                        <Chip size="sm" variant="flat" color={planColors[plan]}>
                          {planLabels[plan]}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{userCount}</td>
                      <td className="px-4 py-3 text-xs text-foreground">
                        {hasRevenue ? brlFormatter.format(revenue) : <span className="text-default-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {tokenCost > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-foreground">{brlFormatter.format(tokenCost)}</span>
                            {userCount > 0 && (
                              <span className="text-xs text-default-400">
                                {brlFormatter.format(tokenCost / userCount)}/user
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-default-400">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-xs ${marginColorClass}`}>
                        {margin !== null ? brlFormatter.format(margin) : <span className="text-default-400">—</span>}
                      </td>
                      <td className={`px-4 py-3 text-xs ${marginColorClass}`}>
                        {marginPct !== null ? (
                          `${marginPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                        ) : (
                          <span className="text-default-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-default-500">
                        {breakEven !== null ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-foreground font-semibold">{breakEven.toLocaleString('pt-BR')} q</span>
                            <span className="text-default-400">
                              de{' '}
                              {(PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.questionsPerPeriod ?? 0).toLocaleString(
                                'pt-BR'
                              )}{' '}
                              disponíveis
                            </span>
                          </div>
                        ) : (
                          <span className="text-default-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-default-400 mt-2">
            * Receita estimada considera 100% assinaturas mensais. Planos anuais têm desconto de ~25%.
          </p>
        </>
      )}
    </div>
  );

  function renderSectionLabel(text: string) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-primary">{text}</span>
      </div>
    );
  }

  function renderKpiCard(label: string, value: string, subtitle?: string) {
    return (
      <div className="bg-content1 border border-default-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-primary mb-2">{label}</p>
        <p className="text-2xl font-extrabold text-foreground mb-1">{value}</p>
        {subtitle && <p className="text-xs text-default-400">{subtitle}</p>}
      </div>
    );
  }

  function renderActionCard(action: string, stats: AdminActionStats, usdToBrl: number) {
    const totalTokens = stats.inputTokens + stats.outputTokens;
    const costBRL = computeCostBRL(stats.inputTokens, stats.outputTokens, usdToBrl);
    const stepEntries = Object.entries(stats.steps);

    return (
      <div key={action} className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider bg-content2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-foreground">{ACTION_LABELS[action] ?? action}</span>
            <Chip size="sm" variant="flat" color="default">
              {action}
            </Chip>
          </div>
          <div className="flex items-center gap-6 text-xs text-default-500">
            <span>
              <span className="text-foreground font-semibold">{stats.count.toLocaleString('pt-BR')}</span> chamadas
            </span>
            <span>
              <span className="text-foreground font-semibold">{totalTokens.toLocaleString('pt-BR')}</span> tokens totais
            </span>
            <span>
              <span className="text-foreground font-semibold">{brlFormatter.format(costBRL)}</span> custo
            </span>
            {stats.avgDurationMs > 0 && (
              <span>
                <span className="text-foreground font-semibold">{formatDuration(stats.avgDurationMs)}</span> duração
                média
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-default-400">Tokens por etapa</span>
            <span className="text-xs text-default-400">
              {stats.inputTokens.toLocaleString('pt-BR')} in / {stats.outputTokens.toLocaleString('pt-BR')} out
            </span>
          </div>

          {stepEntries.length === 0 ? (
            <p className="text-xs text-default-400">Sem dados de etapas registrados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left pb-2 text-xs font-semibold text-default-400">Etapa</th>
                  <th className="text-left pb-2 text-xs font-semibold text-default-400">Input Tokens</th>
                  <th className="text-left pb-2 text-xs font-semibold text-default-400">Output Tokens</th>
                  <th className="text-left pb-2 text-xs font-semibold text-default-400">Total Tokens</th>
                  <th className="text-left pb-2 text-xs font-semibold text-default-400">Custo (BRL)</th>
                  <th className="text-left pb-2 text-xs font-semibold text-default-400">Duração Média</th>
                </tr>
              </thead>
              <tbody>
                {stepEntries.map(([step, stepStats]) => {
                  const stepTotal = stepStats.inputTokens + stepStats.outputTokens;
                  const stepCost = computeCostBRL(stepStats.inputTokens, stepStats.outputTokens, usdToBrl);
                  const stepPct = totalTokens > 0 ? Math.round((stepTotal / totalTokens) * 100) : 0;
                  return (
                    <tr key={step} className="border-b border-divider last:border-0">
                      <td className="py-2.5 pr-4">
                        <span className="text-xs font-semibold text-foreground">{STEP_LABELS[step] ?? step}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-default-500">
                        {stepStats.inputTokens.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-default-500">
                        {stepStats.outputTokens.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {stepTotal.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-xs text-default-400">({stepPct}%)</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-default-500">{brlFormatter.format(stepCost)}</td>
                      <td className="py-2.5 text-xs text-default-500">{formatDuration(stepStats.avgDurationMs)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
}
