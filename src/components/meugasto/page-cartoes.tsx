'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useMGStore, getLancamentosDoMes } from '@/lib/store';
import { fmt, fmtPct, monthLabelShort, shiftMonth } from '@/lib/format';
import type { Lancamento } from '@/lib/types';
import { BarChartGastos } from './charts';
import { EmptyState, Progress, SectionTitle, TxItem } from './shared';

export function PageCartoes({ onEditTx }: { onEditTx: (t: Lancamento) => void }) {
  const s = useMGStore();
  const currentMonth = s.currentMonth;
  const lanMes = getLancamentosDoMes(s.lancamentos, currentMonth);

  const [formOpen, setFormOpen] = React.useState(false);
  const [emoji, setEmoji] = React.useState('💳');
  const [nome, setNome] = React.useState('');
  const [limite, setLimite] = React.useState('');
  const [venc, setVenc] = React.useState('');

  const gastoMesCartoes = lanMes
    .filter((l) => l.isCartao)
    .reduce((a, l) => a + l.valor, 0);

  const comprasCartao = lanMes
    .filter((l) => l.isCartao)
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  // Gasto no cartão ao longo do ano (por mês)
  const gastosAno = Array.from({ length: 12 }, (_, idx) => {
    const ym = shiftMonth(currentMonth, idx - 11);
    const t = s.lancamentos
      .filter((l) => l.isCartao && l.data.startsWith(ym))
      .reduce((a, l) => a + l.valor, 0);
    return { label: monthLabelShort(ym), valor: t };
  });

  const adicionar = () => {
    if (!nome.trim()) return toast.error('Informe o nome do cartão!');
    s.addCartao({
      emoji: emoji.trim() || '💳',
      nome: nome.trim(),
      limite: parseFloat(limite) || 0,
      venc: venc ? parseInt(venc) : null,
    });
    toast.success('Cartão adicionado!');
    setNome('');
    setLimite('');
    setVenc('');
    setEmoji('💳');
    setFormOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
            Cartões cadastrados
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{s.cartoes.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
            Gasto no cartão (mês)
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color: 'var(--expense)' }}>
            {fmt(gastoMesCartoes)}
          </p>
        </div>
      </div>

      {/* Lista de cartões */}
      <SectionTitle
        action={
          <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg text-xs" onClick={() => setFormOpen((v) => !v)}>
            <Plus className="size-3.5" /> Adicionar
          </Button>
        }
      >
        Meus cartões
      </SectionTitle>

      {formOpen && (
        <div className="mb-4 rounded-2xl border-2 border-dashed bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2">
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                className="w-16 shrink-0 text-center text-lg"
                aria-label="Emoji do cartão"
              />
              <Input
                placeholder="Nome do cartão (Ex: Nubank)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Limite (R$)"
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Dia venc."
                min={1}
                max={31}
                value={venc}
                onChange={(e) => setVenc(e.target.value)}
                className="w-28 shrink-0"
              />
            </div>
          </div>
          <Button onClick={adicionar} className="mt-3 w-full rounded-xl sm:w-auto">
            Adicionar cartão
          </Button>
        </div>
      )}

      {s.cartoes.length === 0 ? (
        <EmptyState emoji="💳" title="Nenhum cartão cadastrado" hint="Cadastre cartões para organizar faturas e limites." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.cartoes.map((c) => {
            const gasto = lanMes
              .filter((l) => l.isCartao && l.cartaoId === c.id)
              .reduce((a, l) => a + l.valor, 0);
            const pct = c.limite > 0 ? (gasto / c.limite) * 100 : 0;
            return (
              <div key={c.id} className="group relative overflow-hidden rounded-2xl border bg-card p-4 transition-all hover:shadow-md">
                <div className="chart-gradient pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-10" />
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.emoji}</span>
                  <p className="flex-1 truncate text-sm font-bold">{c.nome}</p>
                  <button
                    onClick={() => {
                      s.deleteCartao(c.id);
                      toast('Cartão removido');
                    }}
                    aria-label={`Excluir cartão ${c.nome}`}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--expense)' }}>
                    {fmt(gasto)}
                  </p>
                  {c.venc && (
                    <p className="text-[0.65rem] text-muted-foreground">vence dia {c.venc}</p>
                  )}
                </div>
                {c.limite > 0 && (
                  <>
                    <div className="mt-2.5">
                      <Progress pct={pct} color="var(--primary)" />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[0.65rem] text-muted-foreground">
                      <span>limite {fmt(c.limite)}</span>
                      <span className="font-semibold">{fmtPct(pct)}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Gráfico ano */}
      <SectionTitle>Gasto no cartão ao longo do ano</SectionTitle>
      <div className="rounded-2xl border bg-card p-4">
        <BarChartGastos data={gastosAno} />
      </div>

      {/* Compras do mês */}
      <SectionTitle>Compras no cartão deste mês</SectionTitle>
      {comprasCartao.length === 0 ? (
        <EmptyState emoji="🛍️" title="Nenhuma compra no cartão neste mês" hint="Ative a opção de cartão ao lançar um gasto." />
      ) : (
        <div className="space-y-2.5">
          {comprasCartao.map((l) => (
            <TxItem
              key={l.id}
              tx={l}
              onEdit={onEditTx}
              onDelete={(t) => {
                s.deleteLancamento(t.id);
                toast('Lançamento excluído');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
