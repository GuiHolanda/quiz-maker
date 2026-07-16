import { Progress } from '@heroui/progress';

import { AdminService } from '@/app/api/admin/admin.service';
import type { UserPlan } from '@/shared/types';
import { ACTIVE_MODEL_PRICING_USD, USD_TO_BRL_FALLBACK, PLAN_PRICES_BRL_MONTHLY, PLAN_LIMITS } from '@/config/constants';

const adminService = new AdminService();

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 4,
});

function computeCostBRL(inputTokens: number, outputTokens: number, usdToBrl: number): number {
  const usd =
    (inputTokens * ACTIVE_MODEL_PRICING_USD.inputPerMillion) / 1_000_000 +
    (outputTokens * ACTIVE_MODEL_PRICING_USD.outputPerMillion) / 1_000_000;
  return usd * usdToBrl;
}

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

  const rateLabel = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(exchangeRate);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground mb-6">Analytics</h1>

      {overview && (
        <>
          <h2 className="text-lg font-bold text-foreground mb-4">Distribuição de Planos</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {(Object.entries(overview.byPlan) as [UserPlan, number][]).map(([plan, count]) => {
              const pct = overview.totalUsers > 0 ? Math.round((count / overview.totalUsers) * 100) : 0;
              return (
                <div key={plan} className="bg-content1 border border-default-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-primary mb-2">{planLabels[plan]}</p>
                  <p className="text-2xl font-extrabold text-foreground mb-2">{count}</p>
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
          <h2 className="text-lg font-bold text-foreground mb-4">Top 10 Usuários — Questões Geradas</h2>
          <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
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
                    const avgPerQ = user.totalQuestionsGeneratedAllTime > 0
                      ? Math.round(totalTokens / user.totalQuestionsGeneratedAllTime)
                      : null;
                    const totalCostBRL = computeCostBRL(user.totalInputTokens, user.totalOutputTokens, exchangeRate);
                    const costPerQBRL = user.totalQuestionsGeneratedAllTime > 0
                      ? totalCostBRL / user.totalQuestionsGeneratedAllTime
                      : null;
                    return (
                      <tr key={user.id} className="border-b border-divider last:border-0">
                        <td className="px-4 py-3 text-default-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground text-sm">{user.name ?? '—'}</p>
                          <p className="text-xs text-default-400">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-default-100 px-2 py-0.5 rounded">{user.plan}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{user.questionsGeneratedThisPeriod}</td>
                        <td className="px-4 py-3">
                          {totalTokens > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-foreground">{totalTokens.toLocaleString('pt-BR')}</span>
                              <span className="text-xs text-default-400">{user.totalInputTokens.toLocaleString('pt-BR')} in / {user.totalOutputTokens.toLocaleString('pt-BR')} out</span>
                            </div>
                          ) : <span className="text-xs text-default-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-default-500">
                          {avgPerQ !== null ? `${avgPerQ.toLocaleString('pt-BR')}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">
                          {totalTokens > 0 ? brlFormatter.format(totalCostBRL) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-default-500">
                          {costPerQBRL !== null ? brlFormatter.format(costPerQBRL) : '—'}
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
          <h2 className="text-lg font-bold text-foreground mb-4">Consumo de Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-content1 border border-default-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary mb-2">Input Tokens (total)</p>
              <p className="text-2xl font-extrabold text-foreground">{overview.totalInputTokens.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-content1 border border-default-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary mb-2">Output Tokens (total)</p>
              <p className="text-2xl font-extrabold text-foreground">{overview.totalOutputTokens.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-content1 border border-default-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary mb-2">Média de tokens por questão</p>
              <p className="text-2xl font-extrabold text-foreground mb-1">{overview.avgTokensPerQuestion.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-default-400">
                ({overview.totalInputTokens.toLocaleString('pt-BR')} in + {overview.totalOutputTokens.toLocaleString('pt-BR')} out)
                {' '}÷ {overview.totalQuestionsGenerated.toLocaleString('pt-BR')} questões
              </p>
            </div>
            <div className="bg-content1 border border-default-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary mb-2">Custo Total (BRL)</p>
              <p className="text-2xl font-extrabold text-foreground mb-1">
                {brlFormatter.format(computeCostBRL(overview.totalInputTokens, overview.totalOutputTokens, exchangeRate))}
              </p>
              <p className="text-xs text-default-400">Cotação: {rateLabel}/USD</p>
            </div>
            <div className="bg-content1 border border-default-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary mb-2">Custo Médio/questão (BRL)</p>
              <p className="text-2xl font-extrabold text-foreground mb-1">
                {overview.totalQuestionsGenerated > 0
                  ? brlFormatter.format(
                      computeCostBRL(overview.totalInputTokens, overview.totalOutputTokens, exchangeRate) /
                      overview.totalQuestionsGenerated
                    )
                  : '—'}
              </p>
              <p className="text-xs text-default-400">
                ({ACTIVE_MODEL_PRICING_USD.inputPerMillion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/M in · {ACTIVE_MODEL_PRICING_USD.outputPerMillion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/M out)
              </p>
            </div>
          </div>
        </>
      )}

      {overview && (
        <>
          <h2 className="text-lg font-bold text-foreground mb-4 mt-8">Margem por Plano</h2>
          <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden mb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
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
                  const planLabelsRow: Record<string, string> = { free: 'Free', pro: 'Pro', pro_ai: 'Pro AI' };
                  const userCount = overview.byPlan[plan] ?? 0;
                  const planPrice = PLAN_PRICES_BRL_MONTHLY[plan] ?? 0;
                  const revenue = userCount * planPrice;
                  const tokens = overview.tokensByPlan[plan];
                  const tokenCost = computeCostBRL(tokens.inputTokens, tokens.outputTokens, exchangeRate);
                  const hasRevenue = planPrice > 0;
                  const margin = hasRevenue ? revenue - tokenCost : null;
                  const marginPct = margin !== null && revenue > 0 ? (margin / revenue) * 100 : null;

                  const avgCostPerQ = tokens.questionsGenerated > 0
                    ? tokenCost / tokens.questionsGenerated
                    : null;
                  const breakEven = avgCostPerQ !== null && avgCostPerQ > 0 && hasRevenue
                    ? Math.floor(planPrice / avgCostPerQ)
                    : null;

                  const marginColor =
                    margin === null ? 'text-default-400' :
                    margin >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold';

                  return (
                    <tr key={plan} className="border-b border-divider last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-xs bg-default-100 px-2 py-0.5 rounded font-medium">{planLabelsRow[plan]}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{userCount}</td>
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
                        ) : <span className="text-xs text-default-400">—</span>}
                      </td>
                      <td className={`px-4 py-3 text-xs ${marginColor}`}>
                        {margin !== null ? brlFormatter.format(margin) : <span className="text-default-400">—</span>}
                      </td>
                      <td className={`px-4 py-3 text-xs ${marginColor}`}>
                        {marginPct !== null
                          ? `${marginPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                          : <span className="text-default-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-default-500">
                        {breakEven !== null ? (
                          <div className="flex flex-col gap-0.5">
                            <span>{breakEven.toLocaleString('pt-BR')} q</span>
                            <span className="text-default-400">
                              de {(PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.questionsPerPeriod ?? 0).toLocaleString('pt-BR')} disponíveis
                            </span>
                          </div>
                        ) : <span className="text-default-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-default-400">* Receita estimada considera 100% assinaturas mensais. Planos anuais têm desconto de ~25%.</p>
        </>
      )}
    </div>
  );
}
