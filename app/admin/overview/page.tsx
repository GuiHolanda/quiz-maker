import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCircleCheck,
  faCircleQuestion,
  faChartSimple,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { Progress } from '@heroui/progress';

import { AdminService } from '@/app/api/admin/admin.service';
import type { AdminOverviewStats, UserPlan } from '@/shared/types';

const adminService = new AdminService();

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

export default async function AdminOverviewPage() {
  let stats: AdminOverviewStats | null = null;

  try {
    stats = await adminService.getOverview();
  } catch {
    // render error state below
  }

  if (!stats) {
    return (
      <div>
        <h1 className="font-sora font-extrabold text-white text-2xl mb-8">Visão Geral</h1>
        <p className="font-mono text-xs" style={{ color: '#6a9fc8' }}>Erro ao carregar métricas.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%' }}>
      <h1 className="font-sora font-extrabold text-white text-2xl mb-8">Visão Geral</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {renderMetricCard('Total de Usuários', stats.totalUsers, 'total cadastrados', faUsers)}
        {renderMetricCard('Assinaturas Ativas', stats.activeSubscriptions, 'planos pagos ativos', faCircleCheck)}
        {renderMetricCard('Questões Geradas', stats.totalQuestionsGenerated, 'geradas por LLM', faCircleQuestion)}
        {renderMetricCard('Uso Médio', `${stats.avgUsagePercent}%`, 'do limite do plano', faChartSimple)}
      </div>

      {renderSectionLabel('Distribuição por Plano')}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {(Object.entries(stats.byPlan) as [UserPlan, number][]).map(([plan, count]) => {
          const pct = stats!.totalUsers > 0 ? Math.round((count / stats!.totalUsers) * 100) : 0;
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
              <Progress color={planColors[plan]} value={pct} size="sm" className="mb-1" />
              <p className="font-mono text-xs" style={{ color: '#4d87bc' }}>{pct}% do total</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  function renderMetricCard(label: string, value: number | string, subtitle: string, icon: IconDefinition) {
    return (
      <div
        className="rounded-lg p-5 flex items-start justify-between gap-4"
        style={{ background: 'rgba(7,14,32,0.6)', border: '1px solid rgba(42,79,122,0.4)' }}
      >
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#6a9fc8' }}>
            {label}
          </p>
          <p className="font-sora font-extrabold text-white text-3xl">{value}</p>
          <p className="font-mono text-xs mt-1" style={{ color: '#4d87bc' }}>{subtitle}</p>
        </div>
        <div
          className="shrink-0"
          style={{
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.12)',
            borderRadius: '8px',
            padding: '8px',
          }}
        >
          <FontAwesomeIcon icon={icon} className="w-4 h-4" style={{ color: '#00d4ff' }} />
        </div>
      </div>
    );
  }

  function renderSectionLabel(text: string) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div
          style={{ width: '2px', height: '16px', background: '#00d4ff', borderRadius: '1px', flexShrink: 0 }}
        />
        <h2 className="font-sora font-bold text-white text-lg">{text}</h2>
      </div>
    );
  }
}
