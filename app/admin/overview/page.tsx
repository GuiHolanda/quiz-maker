import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCircleCheck,
  faCircleQuestion,
  faChartSimple,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';

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
        <h1 className="page-header-title text-foreground mb-8">Visão Geral</h1>
        <p className="text-sm text-default-400">Erro ao carregar métricas.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-header-title text-foreground mb-2">Visão Geral</h1>
      <p className="text-sm text-default-500 mb-8">Métricas gerais da plataforma</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {renderMetricCard('Total de Usuários', stats.totalUsers, 'total cadastrados', faUsers)}
        {renderMetricCard('Assinaturas Ativas', stats.activeSubscriptions, 'planos pagos ativos', faCircleCheck)}
        {renderMetricCard('Questões Geradas', stats.totalQuestionsGenerated, 'geradas por LLM', faCircleQuestion)}
        {renderMetricCard('Uso Médio', `${stats.avgUsagePercent}%`, 'do limite do plano', faChartSimple)}
      </div>

      {renderSectionLabel('Distribuição por Plano')}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {(Object.entries(stats.byPlan) as [UserPlan, number][]).map(([plan, count]) => {
          const pct = stats!.totalUsers > 0 ? Math.round((count / stats!.totalUsers) * 100) : 0;
          return (
            <div key={plan} className="bg-content1 border border-default-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <Chip color={planColors[plan]} size="sm" variant="flat">{planLabels[plan]}</Chip>
                <span className="text-2xl font-extrabold text-foreground">{count}</span>
              </div>
              <Progress color={planColors[plan]} value={pct} size="sm" className="mb-1" />
              <p className="text-xs text-default-400 mt-1">{pct}% do total</p>
            </div>
          );
        })}
      </div>

      {renderSectionLabel('Consumo de Tokens')}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {renderMetricCard(
          'Total Input Tokens',
          stats.totalInputTokens.toLocaleString('pt-BR'),
          'acumulado all-time',
          faChartSimple
        )}
        {renderMetricCard(
          'Total Output Tokens',
          stats.totalOutputTokens.toLocaleString('pt-BR'),
          'acumulado all-time',
          faChartSimple
        )}
        {renderMetricCard(
          'Média tokens/questão',
          stats.avgTokensPerQuestion.toLocaleString('pt-BR'),
          'input + output / questões',
          faCircleQuestion
        )}
      </div>
    </div>
  );

  function renderMetricCard(label: string, value: number | string, subtitle: string, icon: IconDefinition) {
    return (
      <div className="bg-content1 border border-default-200 rounded-xl p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary mb-2">{label}</p>
          <p className="text-3xl font-extrabold text-foreground">{value}</p>
          <p className="text-xs text-default-400 mt-1">{subtitle}</p>
        </div>
        <div className="shrink-0 rounded-lg p-2 bg-primary/10 border border-primary/20">
          <FontAwesomeIcon icon={icon} className="w-4 h-4 text-primary" />
        </div>
      </div>
    );
  }

  function renderSectionLabel(text: string) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-primary">{text}</span>
      </div>
    );
  }
}
