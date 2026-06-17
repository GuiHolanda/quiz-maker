'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Button } from '@heroui/button';
import { addToast } from '@heroui/toast';

import { getAdminUsers, updateAdminUser } from '@/features/connectors';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import type { UserAdminRow, UserPlan, AdminUsersResponse } from '@/shared/types';
import { inputProperties } from '@/config/constants/inputStyles';

const PLAN_OPTIONS: UserPlan[] = ['free', 'pro', 'pro_ai', 'tester', 'admin'];
const STATUS_OPTIONS = ['active', 'canceled'];
const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pendingEdits, setPendingEdits] = useState<Record<string, { plan?: UserPlan; overrideMode: 'none' | 'infinite' | 'value'; overrideValue: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const fetchUsers = useCallback(async () => {
    try {
      const result = await getAdminUsers({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        plan: planFilter || undefined,
        subscriptionStatus: statusFilter || undefined,
      });
      setData(result);
    } catch {
      addToast({ title: 'Erro', description: 'Falha ao carregar usuários', color: 'danger' });
    }
  }, [page, search, planFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function getEdit(user: UserAdminRow) {
    if (pendingEdits[user.id]) return pendingEdits[user.id];
    const overrideMode =
      user.customQuotaOverride === -1 ? 'infinite' :
      user.customQuotaOverride != null ? 'value' : 'none';
    return {
      plan: user.plan,
      overrideMode,
      overrideValue: user.customQuotaOverride != null && user.customQuotaOverride !== -1
        ? String(user.customQuotaOverride) : '',
    };
  }

  function setEdit(userId: string, patch: Partial<{ plan: UserPlan; overrideMode: 'none' | 'infinite' | 'value'; overrideValue: string }>) {
    setPendingEdits((prev) => {
      const user = data?.users.find((u) => u.id === userId)!;
      const current = getEdit(user);
      return { ...prev, [userId]: { ...current, ...patch } };
    });
  }

  async function handleSave(user: UserAdminRow) {
    const edit = getEdit(user);
    setSaving((prev) => ({ ...prev, [user.id]: true }));

    const customQuotaOverride =
      edit.overrideMode === 'infinite' ? -1 :
      edit.overrideMode === 'value' && edit.overrideValue ? parseInt(edit.overrideValue, 10) :
      null;

    try {
      await updateAdminUser(user.id, { plan: edit.plan, customQuotaOverride });
      addToast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso', color: 'success' });
      setPendingEdits((prev) => { const n = { ...prev }; delete n[user.id]; return n; });
      fetchUsers();
    } catch {
      addToast({ title: 'Erro', description: 'Falha ao atualizar usuário', color: 'danger' });
    } finally {
      setSaving((prev) => ({ ...prev, [user.id]: false }));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Usuários</h1>
      {data && <p className="text-sm text-default-400 mb-6">{data.total} usuários cadastrados</p>}

      <div className="flex gap-3 mb-6 flex-wrap">
        <Input
          {...inputProperties.input}
          className="max-w-sm"
          placeholder="Buscar por nome ou email..."
          value={search}
          onValueChange={(v) => { setSearch(v); setPage(1); }}
        />
        <Select
          {...inputProperties.select}
          className="w-40"
          placeholder="Todos os planos"
          selectedKeys={planFilter ? [planFilter] : []}
          onSelectionChange={(keys) => { setPlanFilter(Array.from(keys)[0] as string ?? ''); setPage(1); }}
        >
          {PLAN_OPTIONS.map((p) => <SelectItem key={p}>{p}</SelectItem>)}
        </Select>
        <Select
          {...inputProperties.select}
          className="w-44"
          placeholder="Qualquer status"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onSelectionChange={(keys) => { setStatusFilter(Array.from(keys)[0] as string ?? ''); setPage(1); }}
        >
          {STATUS_OPTIONS.map((s) => <SelectItem key={s}>{s}</SelectItem>)}
        </Select>
      </div>

      <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-divider">
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Usuário</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Plano</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Uso do Período</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Override</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Assinatura</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-default-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users ?? []).map((user) => renderRow(user))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <PaginationControls currentPage={page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );

  function renderRow(user: UserAdminRow) {
    const edit = getEdit(user);
    const effectiveLimit = edit.overrideMode === 'infinite' ? Infinity :
      edit.overrideMode === 'value' && edit.overrideValue ? parseInt(edit.overrideValue, 10) :
      null;
    const planLimit = { free: 250, pro: 1500, pro_ai: 2500, tester: Infinity, admin: Infinity }[edit.plan ?? user.plan] ?? 250;
    const limit = effectiveLimit !== null ? effectiveLimit : planLimit;
    const used = user.questionsGeneratedThisPeriod;
    const pct = limit === Infinity ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const barColor = pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-primary';

    return (
      <tr key={user.id} className="border-b border-divider last:border-0">
        <td className="px-4 py-3">
          <p className="font-semibold text-foreground text-sm">{user.name ?? '—'}</p>
          <p className="text-xs text-default-400">{user.email}</p>
        </td>
        <td className="px-4 py-3">
          <Select
            {...inputProperties.select}
            className="w-28"
            size="sm"
            selectedKeys={[edit.plan ?? user.plan]}
            onSelectionChange={(keys) => setEdit(user.id, { plan: Array.from(keys)[0] as UserPlan })}
          >
            {PLAN_OPTIONS.map((p) => <SelectItem key={p}>{p}</SelectItem>)}
          </Select>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-default-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-default-500">
              {used} / {limit === Infinity ? '∞' : limit}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          {renderOverrideCell(user, edit)}
        </td>
        <td className="px-4 py-3">
          {user.subscriptionStatus ? (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              user.subscriptionStatus === 'active'
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-warning'
            }`}>
              {user.subscriptionStatus}
            </span>
          ) : <span className="text-xs text-default-400">—</span>}
        </td>
        <td className="px-4 py-3">
          <Button
            size="sm"
            isLoading={saving[user.id]}
            className="bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 h-8 px-4 transition-opacity duration-200"
            onPress={() => handleSave(user)}
          >
            Salvar
          </Button>
        </td>
      </tr>
    );
  }

  function renderOverrideCell(user: UserAdminRow, edit: ReturnType<typeof getEdit>) {
    return (
      <div className="flex flex-col gap-1">
        <Select
          {...inputProperties.select}
          className="w-40"
          size="sm"
          selectedKeys={[edit.overrideMode]}
          onSelectionChange={(keys) => setEdit(user.id, { overrideMode: Array.from(keys)[0] as 'none' | 'infinite' | 'value' })}
        >
          <SelectItem key="none">Sem override</SelectItem>
          <SelectItem key="infinite">Infinito (∞)</SelectItem>
          <SelectItem key="value">Valor personalizado</SelectItem>
        </Select>
        {edit.overrideMode === 'value' && (
          <Input
            {...inputProperties.input}
            size="sm"
            type="number"
            className="w-24"
            placeholder="ex: 800"
            value={edit.overrideValue}
            onValueChange={(v) => setEdit(user.id, { overrideValue: v })}
          />
        )}
      </div>
    );
  }
}
