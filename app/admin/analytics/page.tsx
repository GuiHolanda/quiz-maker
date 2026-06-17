import { Progress } from '@heroui/progress';

import { getAdminOverview, getAdminUsers } from '@/features/connectors';
import type { UserPlan } from '@/shared/types';

export default async function AdminAnalyticsPage() {
  const [overview, usersData] = await Promise.all([
    getAdminOverview().catch(() => null),
    getAdminUsers({ page: 1, limit: 10, plan: undefined }).catch(() => null),
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
          <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Questões no Período</th>
                </tr>
              </thead>
              <tbody>
                {usersData.users
                  .sort((a, b) => b.questionsGeneratedThisPeriod - a.questionsGeneratedThisPeriod)
                  .map((user, i) => (
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
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
