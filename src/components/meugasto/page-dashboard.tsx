'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Download, Share2, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMGStore, getLancamentosDoMes, getReceitasDoMes } from '@/lib/store';
import { getAllCats, getCatColor } from '@/lib/constants';
import { fmt, fmtPct, monthLabel, monthLabelShort, shiftMonth } from '@/lib/format';
import type { Lancamento } from '@/lib/types';
import { BarChartGastos, AreaChartInvestimentos, DonutChartCategorias } from './charts';
import { EmptyState, Progress, SectionTitle, TxItem } from './shared';
import { gerarRelatorioPDF } from '@/lib/pdf';
import { toast } from 'sonner';

export function PageDashboard({ onEditTx }: { onEditTx: (t: Lancamento) => void }) {
  const s = useMGStore();
  const mes = s.currentMonth;
  const customCats = s.config.customCats;

  const lanMes = getLancamentosDoMes(s.lancamentos, mes);
  const recMes = getReceitasDoMes(s.receitas, mes);

  const total = lanMes.reduce((a, l) => a + l.valor, 0);
  const receitas = recMes.reduce((a, r) => a + r.valor, 0);
  const saldo = receitas - total;

  // Top categoria (React Compiler memoiza automaticamente)
  const porCat = (() => {
    const totals = lanMes.reduce<Record<string, number>>((acc, l) => {
      acc[l.cat] = (acc[l.cat] || 0) + l.valor;
      return acc;
    }, {});
    return Object.entries(totals)
      .map(([cat, valor]) => ({
        cat,
        valor,
        nome: getAllCats(customCats).find((c) => c.id === cat)?.nome || cat,
        color: getCatColor(cat, customCats),
      }))
      .sort((a, b) => b.valor - a.valor);
  })();

  const topCat = porCat[0];
  const pctTop = total > 0 && topCat ? (topCat.valor / total) * 100 : 0;

  // Gastos por mês (últimos 6)
  const gastosPorMes = Array.from({ length: 6 }, (_, idx) => {
    const ym = shiftMonth(mes, idx - 5);
    const t = s.lancamentos
      .filter((l) => l.data.startsWith(ym))
      .reduce((a, l) => a + l.valor, 0);
    return { label: monthLabelShort(ym), valor: t };
  });

  // Investimentos acumulados por mês
  const invPorMes = Array.from({ length: 6 }, (_, idx) => {
    const ym = shiftMonth(mes, idx - 5);
    const t = s.investimentos
      .filter((inv) => inv.data <= ym + '-31')
      .reduce((a, inv) => a + inv.valor, 0);
    return { label: monthLabelShort(ym), valor: t };
  });

  // Parcelas em aberto
  const parcelasAbertas = (() => {
    const list = lanMes.filter((l) => l.isCartao && l.parcelaTotal && l.grupoParcelaId);
    const grupos = list.reduce<Record<string, { desc: string; total: number; n: number; valor: number }>>(
      (acc, l) => {
        const key = l.grupoParcelaId!;
        acc[key] = acc[key] || { desc: l.desc, total: l.parcelaTotal!, n: 0, valor: l.valor };
        acc[key] = { ...acc[key], n: acc[key].n + 1 };
        return acc;
      },
      {}
    );
    return Object.values(grupos).filter((g) => g.n < g.total);
  })();

  const recentes = [...lanMes]
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .slice(0, 6);

  const plans = s.config.plans;
  const invTotal = s.investimentos.reduce((a, i) => a + i.valor, 0);

  const compartilharWhatsapp = () => {
    const linhas = porCat
      .slice(0, 5)
      .map((c) => `${c.nome}: ${fmt(c.valor)}`)
      .join('\n');
    const texto = [
      `*Relatório ${monthLabel(mes)} — MeuGasto Pro*`,
      ``,
      `💸 Despesas: ${fmt(total)}`,
      `💰 Receitas: ${fmt(receitas)}`,
      `${saldo >= 0 ? '✅' : '⚠️'} Saldo: ${fmt(saldo)}`,
      ``,
      `*Top categorias:*`,
      linhas,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div>
      {/* ============ HERO CARD ============ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="card-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-primary/25"
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
        />
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] opacity-85">
          Total gasto em {monthLabel(mes)}
        </p>
        <p className="mt-1.5 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
          {fmt(total)}
        </p>
        <p className="mt-2 text-sm opacity-80">
          {lanMes.length} lançamento{lanMes.length === 1 ? '' : 's'} este mês ·{' '}
          {fmtPct(pctTop)} em {topCat?.nome || '—'}
        </p>

        {/* mini saldos */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide opacity-85">
              <ArrowUpRight className="size-3.5" /> Receitas
            </div>
            <p className="mt-1 text-sm font-bold tabular-nums sm:text-base">{fmt(receitas)}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide opacity-85">
              <ArrowDownRight className="size-3.5" /> Despesas
            </div>
            <p className="mt-1 text-sm font-bold tabular-nums sm:text-base">{fmt(total)}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide opacity-85">
              <TrendingUp className="size-3.5" /> Saldo
            </div>
            <p className={`mt-1 text-sm font-bold tabular-nums sm:text-base ${saldo < 0 ? 'text-red-200' : 'text-emerald-200'}`}>
              {fmt(saldo)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ============ TOP CATEGORIA ============ */}
      {topCat && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-3 rounded-2xl border bg-card p-4"
        >
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{ background: `${topCat.color}22` }}
          >
            <Trophy className="size-5" style={{ color: topCat.color }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              Maior gasto do mês
            </p>
            <p className="truncate text-sm font-bold">{topCat.nome}</p>
            <p className="text-xs text-muted-foreground">
              {fmt(topCat.valor)} · {fmtPct(pctTop)} do total
            </p>
          </div>
        </motion.div>
      )}

      {/* ============ ORÇAMENTOS ============ */}
      {plans.length > 0 && (
        <>
          <SectionTitle>Orçamentos mensais</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => {
              const gasto = lanMes
                .filter((l) => l.cat === p.cat)
                .reduce((a, l) => a + l.valor, 0);
              const pct = p.limite > 0 ? (gasto / p.limite) * 100 : 0;
              const color = getCatColor(p.cat, customCats);
              return (
                <div key={p.id} className="rounded-2xl border bg-card p-4">
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <span
                      className="flex size-9 items-center justify-center rounded-xl text-base"
                      style={{ background: `${color}20` }}
                    >
                      {p.emoji}
                    </span>
                    <p className="truncate text-[0.8rem] font-semibold text-muted-foreground">
                      {p.nome}
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold tabular-nums">{fmt(gasto)}</p>
                    <p className="text-[0.7rem] text-muted-foreground">de {fmt(p.limite)}</p>
                  </div>
                  <div className="mt-2">
                    <Progress pct={pct} color={color} />
                  </div>
                  <p
                    className={`mt-1.5 text-[0.7rem] font-semibold ${
                      pct > 100 ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {fmtPct(pct)} {pct > 100 ? '· estourou o limite!' : 'utilizado'}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ============ CARTÕES ============ */}
      {s.cartoes.length > 0 && (
        <>
          <SectionTitle action={
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => s.setActivePage('cartoes')}>
              Ver todos
            </Button>
          }>
            Meus cartões
          </SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.cartoes.map((c) => {
              const gasto = lanMes
                .filter((l) => l.isCartao && l.cartaoId === c.id)
                .reduce((a, l) => a + l.valor, 0);
              const pct = c.limite > 0 ? (gasto / c.limite) * 100 : 0;
              return (
                <div key={c.id} className="relative overflow-hidden rounded-2xl border bg-card p-4">
                  <div className="chart-gradient absolute right-0 top-0 h-16 w-16 opacity-10" style={{ borderBottomLeftRadius: '100%' }} />
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <p className="flex-1 truncate text-sm font-bold">{c.nome}</p>
                    {c.venc && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.62rem] font-semibold text-muted-foreground">
                        vence dia {c.venc}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--expense)' }}>
                      {fmt(gasto)}
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground">
                      limite {fmt(c.limite)}
                    </p>
                  </div>
                  <div className="mt-2">
                    <Progress pct={pct} color="var(--primary)" />
                  </div>
                  <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                    {fmtPct(pct)} do limite utilizado
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ============ PARCELAS ============ */}
      {parcelasAbertas.length > 0 && (
        <>
          <SectionTitle>Compras parceladas em aberto</SectionTitle>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {parcelasAbertas.map((g, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border bg-card p-3.5">
                <span className="card-gradient flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white">
                  {g.n + 1}/{g.total}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{g.desc || 'Compra parcelada'}</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    faltam {g.total - g.n}x de {fmt(g.valor)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums">
                  {fmt((g.total - g.n) * g.valor)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============ GRÁFICOS ============ */}
      <SectionTitle>Gastos por mês</SectionTitle>
      <div className="rounded-2xl border bg-card p-4">
        <BarChartGastos data={gastosPorMes} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <SectionTitle>Por categoria</SectionTitle>
          <div className="rounded-2xl border bg-card p-4">
            {porCat.length === 0 ? (
              <EmptyState emoji="📊" title="Sem gastos neste mês" hint="Lance despesas para ver a distribuição por categoria." />
            ) : (
              <>
                <DonutChartCategorias data={porCat} />
                <div className="mt-2 space-y-2.5">
                  {porCat.slice(0, 5).map((c) => (
                    <div key={c.cat} className="flex items-center gap-2.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                      <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">{c.nome}</span>
                      <div className="flex-1">
                        <Progress pct={total > 0 ? (c.valor / total) * 100 : 0} color={c.color} />
                      </div>
                      <span className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums">
                        {fmt(c.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div>
          <SectionTitle>Evolução dos investimentos</SectionTitle>
          <div className="rounded-2xl border bg-card p-4">
            {invTotal === 0 ? (
              <EmptyState emoji="🐷" title="Nenhum investimento ainda" hint="Cadastre investimentos na aba Investimentos para acompanhar sua evolução." />
            ) : (
              <AreaChartInvestimentos data={invPorMes} />
            )}
          </div>
        </div>
      </div>

      {/* ============ ÚLTIMOS LANÇAMENTOS ============ */}
      <SectionTitle
        action={
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => s.setActivePage('lancamentos')}>
            Ver todos
          </Button>
        }
      >
        Últimos lançamentos
      </SectionTitle>
      {recentes.length === 0 ? (
        <EmptyState emoji="🧾" title="Nenhum lançamento neste mês" hint="Toque no botão + para registrar seu primeiro gasto." />
      ) : (
        <div className="space-y-2.5">
          {recentes.map((l) => (
            <TxItem key={l.id} tx={l} onEdit={onEditTx} onDelete={(t) => { s.deleteLancamento(t.id); toast('Lançamento excluído'); }} />
          ))}
        </div>
      )}

      {/* ============ RELATÓRIO ============ */}
      <SectionTitle>Relatório</SectionTitle>
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-sm font-bold">🧾 Relatório mensal</p>
        <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
          Gere um PDF profissional com o resumo do mês, ou compartilhe direto no WhatsApp.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button className="flex-1 rounded-xl" onClick={() => gerarRelatorioPDF(mes)}>
            <Download className="mr-2 size-4" /> Exportar PDF
          </Button>
          <Button variant="whatsapp" className="flex-1 rounded-xl" onClick={compartilharWhatsapp}>
            <Share2 className="mr-2 size-4" /> Enviar no WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
