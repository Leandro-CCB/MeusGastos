'use client';

import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useMGStore } from '@/lib/store';
import { getAllCats, getCatColor } from '@/lib/constants';
import { fmt, formatarDataBr } from '@/lib/format';
import type { Lancamento, Receita } from '@/lib/types';

// ===================== TÍTULO DE SEÇÃO =====================
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between gap-2 first:mt-0">
      <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {children}
      </h3>
      {action}
    </div>
  );
}

// ===================== ESTADO VAZIO =====================
export function EmptyState({
  emoji,
  title,
  hint,
}: {
  emoji: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-center">
      <span className="mb-2 text-4xl" aria-hidden>
        {emoji}
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ===================== GRID DE CATEGORIAS =====================
export function CatGrid({
  value,
  onChange,
  ids,
}: {
  value: string;
  onChange: (id: string) => void;
  ids?: string[];
}) {
  const customCats = useMGStore((s) => s.config.customCats);
  const cats = getAllCats(customCats);
  const list = ids ? cats.filter((c) => ids.includes(c.id)) : cats;

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {list.map((c) => {
        const selected = value === c.id;
        const color = getCatColor(c.id, customCats);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-pressed={selected}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2.5 text-center transition-all hover:-translate-y-0.5 ${
              selected
                ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40'
            }`}
          >
            <span className="text-xl leading-none" aria-hidden>
              {c.emoji}
            </span>
            <span className="w-full truncate text-[0.62rem] font-semibold leading-tight">
              {c.nome}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ===================== ITEM DE LANÇAMENTO =====================
export function TxItem({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Lancamento;
  onEdit?: (t: Lancamento) => void;
  onDelete?: (t: Lancamento) => void;
}) {
  const customCats = useMGStore((s) => s.config.customCats);
  const cat = getAllCats(customCats).find((c) => c.id === tx.cat);
  const color = getCatColor(tx.cat, customCats);

  return (
    <div className="group flex items-center gap-3 rounded-2xl border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: `${color}22` }}
        aria-hidden
      >
        {cat?.emoji || '📦'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{tx.desc || 'Sem descrição'}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <span>{formatarDataBr(tx.data)}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{cat?.nome || 'Outros'}</span>
          {tx.isCartao && (
            <span className="rounded-md bg-primary/12 px-1.5 py-0.5 text-[0.62rem] font-bold text-primary">
              💳 {tx.parcelaTotal ? `${tx.parcelaAtual}/${tx.parcelaTotal}` : 'Cartão'}
            </span>
          )}
        </p>
      </div>
      <p className="shrink-0 text-sm font-bold tabular-nums" style={{ color: 'var(--expense)' }}>
        −{fmt(tx.valor)}
      </p>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row">
          {onEdit && (
            <button
              onClick={() => onEdit(tx)}
              aria-label={`Editar ${tx.desc || 'lançamento'}`}
              className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition-all hover:bg-primary/10 hover:text-primary hover:opacity-100"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(tx)}
              aria-label={`Excluir ${tx.desc || 'lançamento'}`}
              className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== ITEM DE RECEITA =====================
export function ReceitaItem({
  r,
  onDelete,
}: {
  r: Receita;
  onDelete?: (r: Receita) => void;
}) {
  const customCats = useMGStore((s) => s.config.customCats);
  const cat = getAllCats(customCats).find((c) => c.id === r.cat);
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition-all hover:border-income/30 hover:shadow-sm">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-income/15 text-lg" aria-hidden>
        {cat?.emoji || '💰'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{r.desc || 'Sem descrição'}</p>
        <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
          {formatarDataBr(r.data)} · {cat?.nome || 'Outros'}
        </p>
      </div>
      <p className="shrink-0 text-sm font-bold tabular-nums" style={{ color: 'var(--income)' }}>
        +{fmt(r.valor)}
      </p>
      {onDelete && (
        <button
          onClick={() => onDelete(r)}
          aria-label={`Excluir receita ${r.desc || ''}`}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ===================== BARRA DE PROGRESSO =====================
export function Progress({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const over = pct > 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${clamped}%`,
          background: over ? 'var(--expense)' : color,
        }}
      />
    </div>
  );
}
