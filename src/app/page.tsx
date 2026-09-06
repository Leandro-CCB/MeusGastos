'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useMGStore, type MigracaoLegadoInfo } from '@/lib/store';
import type { Lancamento } from '@/lib/types';
import { AppShell } from '@/components/meugasto/app-shell';
import { PageDashboard } from '@/components/meugasto/page-dashboard';
import { PageLancar } from '@/components/meugasto/page-lancar';
import { PageLancamentos } from '@/components/meugasto/page-lancamentos';
import { PageReceitas } from '@/components/meugasto/page-receitas';
import { PageCartoes } from '@/components/meugasto/page-cartoes';
import { PageInvestimentos } from '@/components/meugasto/page-investimentos';
import { PageFixas } from '@/components/meugasto/page-fixas';
import { PageConfig } from '@/components/meugasto/page-config';
import { PageCodigos } from '@/components/meugasto/page-codigos';
import { LicencaProvider, RequireLicenca, useLicenca } from '@/components/meugasto/license-gate';
import { EditTxModal } from '@/components/meugasto/edit-tx-modal';

function AppSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-5 sm:px-6">
      <Skeleton className="h-56 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="hidden h-24 rounded-2xl sm:block" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

/** Avisa o cliente que os dados do MeuGasto original foram migrados com segurança. */
function notificarMigracao(info: MigracaoLegadoInfo) {
  const partes: string[] = [];
  if (info.lancamentos) partes.push(`${info.lancamentos} lançamento(s)`);
  if (info.receitas) partes.push(`${info.receitas} receita(s)`);
  if (info.cartoes) partes.push(`${info.cartoes} cartão(ões)`);
  if (info.investimentos) partes.push(`${info.investimentos} investimento(s)`);
  if (info.contasFixas) partes.push(`${info.contasFixas} conta(s) fixa(s)`);
  toast.success('Dados do MeuGasto original importados!', {
    description: `${partes.join(', ')} migrados com sucesso. Seus dados antigos continuam intactos no app original e uma cópia de segurança foi criada em Ajustes.`,
    duration: 12000,
  });
}

export default function Home() {
  return (
    <LicencaProvider>
      <RequireLicenca>
        <MeuGastoApp />
      </RequireLicenca>
    </LicencaProvider>
  );
}

function MeuGastoApp() {
  const activePage = useMGStore((s) => s.activePage);
  const setActivePage = useMGStore((s) => s.setActivePage);
  const importarDadosLegados = useMGStore((s) => s.importarDadosLegados);
  const { isMaster } = useLicenca();
  const [mounted, setMounted] = React.useState(false);
  const [editingTx, setEditingTx] = React.useState<Lancamento | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const res = importarDadosLegados();
    if (res) notificarMigracao(res);
  }, [importarDadosLegados]);

  // proteção: página de códigos só existe para master
  React.useEffect(() => {
    if (activePage === 'codigos' && !isMaster) {
      setActivePage('dashboard');
    }
  }, [activePage, isMaster, setActivePage]);

  if (!mounted) {
    return <AppSkeleton />;
  }

  const paginaEfetiva = activePage === 'codigos' && !isMaster ? 'dashboard' : activePage;

  return (
    <>
      <AppShell>
        {paginaEfetiva === 'dashboard' && <PageDashboard onEditTx={setEditingTx} />}
        {paginaEfetiva === 'lancar' && <PageLancar />}
        {paginaEfetiva === 'lancamentos' && <PageLancamentos onEditTx={setEditingTx} />}
        {paginaEfetiva === 'receitas' && <PageReceitas />}
        {paginaEfetiva === 'cartoes' && <PageCartoes onEditTx={setEditingTx} />}
        {paginaEfetiva === 'investimentos' && <PageInvestimentos />}
        {paginaEfetiva === 'fixas' && <PageFixas />}
        {paginaEfetiva === 'config' && <PageConfig />}
        {paginaEfetiva === 'codigos' && isMaster && <PageCodigos />}
      </AppShell>
      <EditTxModal tx={editingTx} onClose={() => setEditingTx(null)} />
    </>
  );
}
