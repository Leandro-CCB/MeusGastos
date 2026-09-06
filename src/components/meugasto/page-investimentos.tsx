'use client';

import * as React from 'react';
import { Save, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useMGStore, calcularEstimativa } from '@/lib/store';
import { INV_TIPOS } from '@/lib/constants';
import { fmt, formatarDataBr, todayISO } from '@/lib/format';
import type { InvTipo } from '@/lib/types';
import { EmptyState, SectionTitle } from './shared';

export function PageInvestimentos() {
  const s = useMGStore();
  const total = s.investimentos.reduce((a, i) => a + i.valor, 0);

  const [tipo, setTipo] = React.useState<InvTipo>('cdb');
  const [nome, setNome] = React.useState('');
  const [valor, setValor] = React.useState('');
  const [data, setData] = React.useState(todayISO());
  const [vencimento, setVencimento] = React.useState('');
  const [taxa, setTaxa] = React.useState('');
  const [periodicidade, setPeriodicidade] = React.useState<'mensal' | 'diario'>('mensal');

  const estimativa = (() => {
    const v = parseFloat(valor.replace(',', '.')) || 0;
    const t = parseFloat(taxa.replace(',', '.')) || 0;
    if (!v || !t || !data || !vencimento) return null;
    return calcularEstimativa(v, t, periodicidade, data, vencimento);
  })();

  const salvar = () => {
    const v = parseFloat(valor.replace(',', '.'));
    if (!v || v <= 0) return toast.error('Informe o valor investido!');
    if (!data) return toast.error('Informe a data da aplicação!');
    s.addInvestimento({
      tipo,
      nome: nome.trim(),
      valor: v,
      data,
      vencimento: vencimento || '',
      taxa: parseFloat(taxa.replace(',', '.')) || 0,
      periodicidade,
      valorEstimado: estimativa ? Math.round(estimativa.valorFuturo * 100) / 100 : null,
    });
    toast.success('Investimento salvo!');
    setNome('');
    setValor('');
    setTaxa('');
    setVencimento('');
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Card total */}
      <div
        className="rounded-3xl p-6 text-white shadow-xl"
        style={{
          background: 'linear-gradient(135deg, var(--income), color-mix(in oklab, var(--income), #0ea5e9 30%))',
        }}
      >
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] opacity-85">
          Total investido
        </p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums">{fmt(total)}</p>
        <p className="mt-1.5 text-sm opacity-80">
          {s.investimentos.length} aplicaç{s.investimentos.length === 1 ? 'ão' : 'ões'}
        </p>
      </div>

      {/* Form */}
      <div className="mt-5 rounded-3xl border bg-card p-5 sm:p-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
          <Sparkles className="size-4" /> Novo investimento
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as InvTipo)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INV_TIPOS).map(([id, t]) => (
                  <SelectItem key={id} value={id}>
                    {t.emoji} {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fi-nome" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nome / Descrição
            </Label>
            <Input
              id="fi-nome"
              placeholder="Ex: CDB Banco XP 120% CDI"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="fi-valor" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Valor investido (R$)
            </Label>
            <Input
              id="fi-valor"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="mt-1.5 h-12 rounded-xl font-bold"
            />
          </div>
          <div>
            <Label htmlFor="fi-data" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Data da aplicação
            </Label>
            <Input
              id="fi-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="fi-venc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vencimento (se houver)
            </Label>
            <Input
              id="fi-venc"
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="fi-taxa" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Juros (%)
              </Label>
              <Input
                id="fi-taxa"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="1,05"
                value={taxa}
                onChange={(e) => setTaxa(e.target.value)}
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Período
              </Label>
              <Select value={periodicidade} onValueChange={(v) => setPeriodicidade(v as 'mensal' | 'diario')}>
                <SelectTrigger className="mt-1.5 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="diario">Diário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {estimativa && (
          <div className="mt-4 rounded-2xl border border-income/40 bg-income/10 p-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
              💰 Valor estimado no vencimento
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: 'var(--income)' }}>
              {fmt(estimativa.valorFuturo)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {estimativa.dias} dias · {Math.round(estimativa.periodos)} períodos de juros compostos a{' '}
              {taxa}% {periodicidade === 'mensal' ? 'ao mês' : 'ao dia'}
            </p>
          </div>
        )}

        <Button size="lg" onClick={salvar} className="mt-5 h-13 w-full rounded-2xl font-bold">
          <Save className="mr-2 size-4" /> Salvar investimento
        </Button>
      </div>

      {/* Lista */}
      <SectionTitle>Meus investimentos</SectionTitle>
      {s.investimentos.length === 0 ? (
        <EmptyState emoji="🐷" title="Nenhum investimento cadastrado" hint="Comece registrando sua primeira aplicação financeira." />
      ) : (
        <div className="space-y-2.5">
          {s.investimentos.map((i) => {
            const info = INV_TIPOS[i.tipo] || INV_TIPOS.outros;
            const rendimento =
              i.valorEstimado && i.valorEstimado > i.valor
                ? i.valorEstimado - i.valor
                : null;
            return (
              <div key={i.id} className="group flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-all hover:shadow-sm">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-income/15 text-lg">
                  {info.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{i.nome || info.nome}</p>
                  <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                    {info.nome} · {formatarDataBr(i.data)}
                    {i.vencimento ? ` → ${formatarDataBr(i.vencimento)}` : ''}
                    {i.taxa > 0 ? ` · ${i.taxa}% ${i.periodicidade === 'mensal' ? 'a.m.' : 'a.d.'}` : ''}
                  </p>
                  {rendimento !== null && (
                    <p className="mt-0.5 text-[0.7rem] font-semibold" style={{ color: 'var(--income)' }}>
                      rendimento estimado: +{fmt(rendimento)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--income)' }}>
                    {fmt(i.valor)}
                  </p>
                  {i.valorEstimado && (
                    <p className="text-[0.65rem] text-muted-foreground">
                      → {fmt(i.valorEstimado)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    s.deleteInvestimento(i.id);
                    toast('Investimento removido');
                  }}
                  aria-label={`Remover investimento ${i.nome || info.nome}`}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
