import { getAdminOverview } from '@/features/connectors';
import type { AdminOverviewStats, UserPlan } from '@/shared/types';

export default async function AdminOverviewPage() {
  let stats: AdminOverviewStats | null = null;

  try {
    stats = await getAdminOverview();
  } catch {
    // render error state below
  }

  if (!stats) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Visão Geral</h1>
        <p className="text-default-500 text-sm">Erro ao carregar métricas.</p>
      </div>
    );
  }

  const planLabels: Record<UserPlan, string> = {
    free: 'Free',
    pro: 'Pro',
    pro_ai: 'Pro AI',
    tester: 'Tester',
    admin: 'Admin',
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground mb-6">Visão Geral</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {renderMetricCard('Total de Usuários', stats.totalUsers)}
        {renderMetricCard('Assinaturas Ativas', stats.activeSubscriptions)}
        {renderMetricCard('Questões Geradas', stats.totalQuestionsGenerated)}
        {renderMetricCard('Uso Médio', `${stats.avgUsagePercent}%`)}
      </div>

      <h2 className="text-lg font-bold text-foreground mb-4">Distribuição por Plano</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {(Object.entries(stats.byPlan) as [UserPlan, number][]).map(([plan, count]) => (
          <div key={plan} className="bg-content1 border border-default-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-primary mb-1">{planLabels[plan]}</p>
            <p className="text-2xl font-extrabold text-foreground">{count}</p>
            <p className="text-xs text-default-400 mt-1">
              {stats!.totalUsers > 0 ? Math.round((count / stats!.totalUsers) * 100) : 0}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  function renderMetricCard(label: string, value: number | string) {
    return (
      <div className="bg-content1 border border-default-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-default-400 mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-foreground">{value}</p>
      </div>
    );
  }
}
