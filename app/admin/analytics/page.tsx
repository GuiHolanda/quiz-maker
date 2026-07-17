import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';

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
    <div style={{ background: '#070e20', minHeight: '100%' }} className="px-6 py-8">
      <h1 className="font-sora font-extrabold text-white text-2xl mb-8">Analytics</h1>

      {overview && (
        <>
          {renderSectionLabel('Distribuição de Planos')}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
            {(Object.entries(overview.byPlan) as [UserPlan, number][]).map(([plan, count]) => {
              const pct = overview.totalUsers > 0 ? Math.round((count / overview.totalUsers) * 100) : 0;
              return (
                <div
                  key={plan}
                  className="rounded-lg p-4"
                  style={{ background: 'rgba(7,14,32,0.6)', border: '1px solid rgba(42,79,122,0.4)' }}
                >
                  <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#6a9fc8' }}>
                    {planLabels[plan]}
                  </p>
                  <p className="font-sora font-extrabold text-white text-2xl mb-2">{count}</p>
                  <Progress color={planColors[plan]} value={pct} size="sm" />
                  <p className="font-mono text-xs mt-1" style={{ color: '#4d87bc' }}>{pct}% do total</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {usersData && (
        <>
          {renderSectionLabel('Top 10 Usuários')}
          <div className="rounded-lg overflow-hidden mb-10" style={{ border: '1px solid rgba(42,79,122,0.4)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(7,14,32,0.8)', borderBottom: '1px solid rgba(42,79,122,0.4)' }}>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>#</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Usuário</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Plano</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Questões no Período</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Total Tokens</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Avg/questão</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Custo Total</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Custo/questão</th>
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
                      <tr
                        key={user.id}
                        className="last:border-0"
                        style={{ background: 'rgba(15,27,61,0.3)', borderBottom: '1px solid rgba(30,58,95,0.4)' }}
                      >
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: '#4d87bc' }}>{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-sora font-semibold text-white text-sm">{user.name ?? '—'}</p>
                          <p className="font-mono text-xs" style={{ color: '#6a9fc8' }}>{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Chip size="sm" variant="flat" color={planColors[user.plan]}>
                            {planLabels[user.plan]}
                          </Chip>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-white font-semibold">
                          {user.questionsGeneratedThisPeriod}
                        </td>
                        <td className="px-4 py-3">
                          {totalTokens > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-sm text-white font-semibold">{totalTokens.toLocaleString('pt-BR')}</span>
                              <span className="font-mono text-xs" style={{ color: '#6a9fc8' }}>
                                {user.totalInputTokens.toLocaleString('pt-BR')} in / {user.totalOutputTokens.toLocaleString('pt-BR')} out
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-xs" style={{ color: '#4d87bc' }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: '#6a9fc8' }}>
                          {avgPerQ !== null ? avgPerQ.toLocaleString('pt-BR') : (
                            <span style={{ color: '#4d87bc' }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-white font-semibold">
                          {totalTokens > 0 ? brlFormatter.format(totalCostBRL) : (
                            <span className="font-mono text-xs" style={{ color: '#4d87bc' }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: '#6a9fc8' }}>
                          {costPerQBRL !== null ? brlFormatter.format(costPerQBRL) : (
                            <span style={{ color: '#4d87bc' }}>—</span>
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
            <div className="rounded-lg p-4" style={{ background: 'rgba(7,14,32,0.6)', border: '1px solid rgba(42,79,122,0.4)' }}>
              <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#6a9fc8' }}>Input Tokens (total)</p>
              <p className="font-sora font-extrabold text-white text-2xl">{overview.totalInputTokens.toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(7,14,32,0.6)', border: '1px solid rgba(42,79,122,0.4)' }}>
              <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#6a9fc8' }}>Output Tokens (total)</p>
              <p className="font-sora font-extrabold text-white text-2xl">{overview.totalOutputTokens.toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(7,14,32,0.6)', border: '1px solid rgba(42,79,122,0.4)' }}>
              <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#6a9fc8' }}>Media tokens/questão</p>
              <p className="font-sora font-extrabold text-white text-2xl mb-1">{overview.avgTokensPerQuestion.toLocaleString('pt-BR')}</p>
              <p className="font-mono text-xs" style={{ color: '#4d87bc' }}>
                ({overview.totalInputTokens.toLocaleString('pt-BR')} in + {overview.totalOutputTokens.toLocaleString('pt-BR')} out)
                {' '}/ {overview.totalQuestionsGenerated.toLocaleString('pt-BR')} questões
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(7,14,32,0.6)', border: '1px solid rgba(42,79,122,0.4)' }}>
              <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#6a9fc8' }}>Custo Total (BRL)</p>
              <p className="font-sora font-extrabold text-white text-2xl mb-1">
                {brlFormatter.format(computeCostBRL(overview.totalInputTokens, overview.totalOutputTokens, exchangeRate))}
              </p>
              <p className="font-mono text-xs" style={{ color: '#4d87bc' }}>Cotação: {rateLabel}/USD</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(7,14,32,0.6)', border: '1px solid rgba(42,79,122,0.4)' }}>
              <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#6a9fc8' }}>Custo Medio/questão</p>
              <p className="font-sora font-extrabold text-white text-2xl mb-1">
                {overview.totalQuestionsGenerated > 0
                  ? brlFormatter.format(
                      computeCostBRL(overview.totalInputTokens, overview.totalOutputTokens, exchangeRate) /
                      overview.totalQuestionsGenerated
                    )
                  : '—'}
              </p>
              <p className="font-mono text-xs" style={{ color: '#4d87bc' }}>
                ({ACTIVE_MODEL_PRICING_USD.inputPerMillion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/M in
                {' '} {ACTIVE_MODEL_PRICING_USD.outputPerMillion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/M out)
              </p>
            </div>
          </div>
        </>
      )}

      {overview && (
        <>
          {renderSectionLabel('Margem por Plano')}
          <div className="rounded-lg overflow-hidden mb-2" style={{ border: '1px solid rgba(42,79,122,0.4)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(7,14,32,0.8)', borderBottom: '1px solid rgba(42,79,122,0.4)' }}>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Plano</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Usuários</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Receita est./mês *</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Custo Tokens</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Margem</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>% Margem</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest" style={{ color: '#6a9fc8' }}>Break-even</th>
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

                  const avgCostPerQ = tokens.questionsGenerated > 0
                    ? tokenCost / tokens.questionsGenerated
                    : null;
                  const breakEven = avgCostPerQ !== null && avgCostPerQ > 0 && hasRevenue
                    ? Math.floor(planPrice / avgCostPerQ)
                    : null;

                  const marginColor =
                    margin === null ? '' :
                    margin >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold';

                  const rowBg =
                    margin === null
                      ? 'rgba(15,27,61,0.3)'
                      : margin >= 0
                      ? 'rgba(52,211,153,0.05)'
                      : 'rgba(248,113,113,0.05)';

                  return (
                    <tr
                      key={plan}
                      className="last:border-0"
                      style={{ background: rowBg, borderBottom: '1px solid rgba(30,58,95,0.4)' }}
                    >
                      <td className="px-4 py-3">
                        <Chip size="sm" variant="flat" color={planColors[plan]}>
                          {planLabels[plan]}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-white font-semibold">{userCount}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white">
                        {hasRevenue ? brlFormatter.format(revenue) : (
                          <span style={{ color: '#4d87bc' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tokenCost > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs text-white">{brlFormatter.format(tokenCost)}</span>
                            {userCount > 0 && (
                              <span className="font-mono text-xs" style={{ color: '#6a9fc8' }}>
                                {brlFormatter.format(tokenCost / userCount)}/user
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs" style={{ color: '#4d87bc' }}>—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs ${marginColor}`}>
                        {margin !== null ? brlFormatter.format(margin) : (
                          <span style={{ color: '#4d87bc' }}>—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs ${marginColor}`}>
                        {marginPct !== null
                          ? `${marginPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                          : <span style={{ color: '#4d87bc' }}>—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#6a9fc8' }}>
                        {breakEven !== null ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white font-semibold">{breakEven.toLocaleString('pt-BR')} q</span>
                            <span style={{ color: '#4d87bc' }}>
                              de {(PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.questionsPerPeriod ?? 0).toLocaleString('pt-BR')} disponíveis
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#4d87bc' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="font-mono text-xs mt-2" style={{ color: '#4d87bc' }}>
            * Receita estimada considera 100% assinaturas mensais. Planos anuais têm desconto de ~25%.
          </p>
        </>
      )}
    </div>
  );

  function renderSectionLabel(text: string) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div style={{ width: '2px', height: '16px', background: '#00d4ff', borderRadius: '1px', flexShrink: 0 }} />
        <h2 className="font-sora font-bold text-white text-lg">{text}</h2>
      </div>
    );
  }
}
