'use client';

import * as React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useMGStore, getReceitasDoMes } from '@/lib/store';
import { REC_CATS } from '@/lib/constants';
import { fmt, todayISO } from '@/lib/format';
import { EmptyState, ReceitaItem, SectionTitle } from './shared';

export function PageReceitas() {
  const receitas = useMGStore((s) => s.receitas);
  const currentMonth = useMGStore((s) => s.currentMonth);
  const addReceita = useMGStore((s) => s.addReceita);
  const deleteReceita = useMGStore((s) => s.deleteReceita);

  const [valor, setValor] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [data, setData] = React.useState(todayISO());
  const [cat, setCat] = React.useState('');

  const doMes = getReceitasDoMes(receitas, currentMonth);
  const total = doMes.reduce((a, r) => a + r.valor, 0);

  const porOrigem = (() => {
    const totals = doMes.reduce<Record<string, number>>((acc, r) => {
      acc[r.cat] = (acc[r.cat] || 0) + r.valor;
      return acc;
    }, {});
    return REC_CATS.map((c) => ({ ...c, valor: totals[c.id] || 0 })).filter((c) => c.valor > 0);
  })();

  const salvar = () => {
    const v = parseFloat(valor.replace(',', '.'));
    if (!v || v <= 0) return toast.error('Informe um valor válido!');
    if (!cat) return toast.error('Selecione a origem da receita!');
    if (!data) return toast.error('Informe a data!');
    addReceita({ valor: v, desc: desc.trim(), cat, data });
    toast.success('Receita salva!');
    setValor('');
    setDesc('');
    setCat('');
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Card total */}
      <div className="rounded-3xl bg-income p-6 text-white shadow-xl" style={{ background: 'linear-gradient(135deg, var(--income), color-mix(in oklab, var(--income), black 22%))' }}>
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] opacity-85">
          Receitas do mês
        </p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums">{fmt(total)}</p>
        <p className="mt-1.5 text-sm opacity-80">{doMes.length} receita{doMes.length === 1 ? '' : 's'} registrada{doMes.length === 1 ? '' : 's'}</p>
      </div>

      {/* Form */}
      <div className="mt-5 rounded-3xl border bg-card p-5 sm:p-6">
        <div className="mb-4">
          <Label htmlFor="rc-valor" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Valor (R$)
          </Label>
          <Input
            id="rc-valor"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="mt-1.5 h-14 rounded-2xl text-xl font-bold"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="rc-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Descrição
          </Label>
          <Input
            id="rc-desc"
            placeholder="Ex: Salário, freela do site, diária"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && salvar()}
            className="mt-1.5 h-12 rounded-xl"
          />
        </div>
        <div className="mb-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Origem
          </Label>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {REC_CATS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                aria-pressed={cat === c.id}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2.5 transition-all hover:-translate-y-0.5 ${
                  cat === c.id
                    ? 'border-income bg-income/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-income/40'
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="w-full truncate text-[0.62rem] font-semibold">{c.nome}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <Label htmlFor="rc-data" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Data
          </Label>
          <Input
            id="rc-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mt-1.5 h-12 rounded-xl"
          />
        </div>
        <Button size="lg" onClick={salvar} className="h-13 w-full rounded-2xl font-bold">
          <Save className="mr-2 size-4" /> Salvar receita
        </Button>
      </div>

      {/* Por origem */}
      {porOrigem.length > 0 && (
        <>
          <SectionTitle>Por origem</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {porOrigem.map((c) => (
              <div key={c.id} className="rounded-2xl border bg-card p-3.5">
                <p className="text-lg">{c.emoji}</p>
                <p className="mt-1 text-[0.7rem] font-semibold text-muted-foreground">{c.nome}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--income)' }}>
                  {fmt(c.valor)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Receitas do mês</SectionTitle>
      {doMes.length === 0 ? (
        <EmptyState emoji="💰" title="Nenhuma receita neste mês" hint="Registre salários, serviços e outras entradas de dinheiro." />
      ) : (
        <div className="space-y-2.5">
          {[...doMes]
            .sort((a, b) => (a.data < b.data ? 1 : -1))
            .map((r) => (
              <ReceitaItem
                key={r.id}
                r={r}
                onDelete={(x) => {
                  deleteReceita(x.id);
                  toast('Receita excluída');
                }}
              />
            ))}
        </div>
      )}
    </div>
  );
}
