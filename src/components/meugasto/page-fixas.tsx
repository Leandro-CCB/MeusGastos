'use client';

import * as React from 'react';
import { CalendarClock, Check, Pencil, Plus, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useMGStore } from '@/lib/store';
import { getCatColor } from '@/lib/constants';
import { fmt, todayISO } from '@/lib/format';
import type { ContaFixa } from '@/lib/types';
import { CatGrid, EmptyState, SectionTitle } from './shared';

function statusContaFixa(conta: ContaFixa, mes: string) {
  const pag = conta.pagamentos?.[mes];
  if (pag) return { tipo: 'pago' as const, pag };
  const [y, m] = mes.split('-').map(Number);
  const vencDate = new Date(y, m - 1, conta.dia);
  const hoje = new Date();
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (vencDate < hojeSemHora) return { tipo: 'atrasado' as const };
  return { tipo: 'aberto' as const };
}

export function PageFixas() {
  const s = useMGStore();
  const mes = s.currentMonth;

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [nome, setNome] = React.useState('');
  const [cat, setCat] = React.useState('');
  const [dia, setDia] = React.useState('');
  const [valorEst, setValorEst] = React.useState('');

  // modal pagamento
  const [payId, setPayId] = React.useState<string | null>(null);
  const [payValor, setPayValor] = React.useState('');
  const [payData, setPayData] = React.useState(todayISO());

  const stats = (() => {
    let pago = 0;
    let aberto = 0;
    let atrasado = 0;
    let totalPago = 0;
    s.contasFixas.forEach((c) => {
      const st = statusContaFixa(c, mes);
      if (st.tipo === 'pago') {
        pago++;
        totalPago += st.pag.valor;
      } else if (st.tipo === 'atrasado') atrasado++;
      else aberto++;
    });
    return { pago, aberto, atrasado, totalPago };
  })();

  const abrirForm = (c?: ContaFixa) => {
    if (c) {
      setEditingId(c.id);
      setNome(c.nome);
      setCat(c.cat);
      setDia(String(c.dia));
      setValorEst(String(c.valorEstimado || ''));
    } else {
      setEditingId(null);
      setNome('');
      setCat('');
      setDia('');
      setValorEst('');
    }
    setFormOpen(true);
  };

  const salvar = () => {
    const d = parseInt(dia);
    if (!nome.trim()) return toast.error('Informe o nome da conta!');
    if (!cat) return toast.error('Selecione uma categoria!');
    if (!d || d < 1 || d > 31) return toast.error('Informe um dia de vencimento válido (1-31)!');
    const vEst = parseFloat(valorEst.replace(',', '.')) || 0;
    if (editingId) {
      s.updateContaFixa(editingId, { nome: nome.trim(), cat, dia: d, valorEstimado: vEst });
      toast.success('Conta atualizada!');
    } else {
      s.addContaFixa({ nome: nome.trim(), cat, dia: d, valorEstimado: vEst });
      toast.success('Conta fixa criada!');
    }
    setFormOpen(false);
  };

  const contaPagar = s.contasFixas.find((c) => c.id === payId);

  const abrirModalPagar = (c: ContaFixa) => {
    setPayId(c.id);
    setPayValor(c.valorEstimado > 0 ? String(c.valorEstimado) : '');
    setPayData(todayISO());
  };

  const confirmarPagamento = () => {
    const v = parseFloat(payValor.replace(',', '.'));
    if (!v || v <= 0) return toast.error('Informe o valor pago!');
    if (!payData) return toast.error('Informe a data do pagamento!');
    if (payId) {
      s.pagarContaFixa(payId, mes, v, payData);
      toast.success('Pagamento registrado! Lançamento criado automaticamente.');
    }
    setPayId(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums text-primary">{stats.aberto}</p>
          <p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">Em aberto</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--income)' }}>{stats.pago}</p>
          <p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">Pagas</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--expense)' }}>{stats.atrasado}</p>
          <p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">Atrasadas</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums">{fmt(stats.totalPago)}</p>
          <p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">Total pago</p>
        </div>
      </div>

      <SectionTitle
        action={
          <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg text-xs" onClick={() => abrirForm()}>
            <Plus className="size-3.5" /> Nova conta
          </Button>
        }
      >
        Suas contas fixas
      </SectionTitle>

      {/* Form add/edit */}
      {formOpen && (
        <div className="mb-4 rounded-2xl border-2 border-dashed bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</Label>
              <Input
                placeholder="Ex: Conta de Luz"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dia venc.</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="10"
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor est.</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={valorEst}
                  onChange={(e) => setValorEst(e.target.value)}
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</Label>
            <div className="mt-2">
              <CatGrid value={cat} onChange={setCat} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={salvar} className="flex-1 rounded-xl">
              Salvar conta fixa
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {s.contasFixas.length === 0 ? (
        <EmptyState
          emoji="🧾"
          title="Nenhuma conta fixa cadastrada"
          hint="Cadastre contas recorrentes (luz, água, internet) e marque os pagamentos mês a mês."
        />
      ) : (
        <div className="space-y-2.5">
          {s.contasFixas.map((c) => {
            const st = statusContaFixa(c, mes);
            const color = getCatColor(c.cat, s.config.customCats);
            return (
              <div key={c.id} className="group rounded-2xl border bg-card p-4 transition-all hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ background: `${color}20` }}
                  >
                    <CalendarClock className="size-5" style={{ color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{c.nome}</p>
                    <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                      vence todo dia {c.dia}
                      {c.valorEstimado > 0 ? ` · ~${fmt(c.valorEstimado)}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => abrirForm(c)}
                      aria-label={`Editar ${c.nome}`}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition-all hover:bg-primary/10 hover:text-primary hover:opacity-100"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        s.deleteContaFixa(c.id);
                        toast('Conta removida');
                      }}
                      aria-label={`Excluir ${c.nome}`}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                  {st.tipo === 'pago' ? (
                    <>
                      <span className="rounded-full bg-income/15 px-3 py-1 text-[0.7rem] font-bold" style={{ color: 'var(--income)' }}>
                        ✓ Paga · {fmt(st.pag.valor)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground"
                        onClick={() => {
                          s.desfazerPagamentoFixa(c.id, mes);
                          toast('Pagamento desfeito');
                        }}
                      >
                        <Undo2 className="size-3.5" /> Desfazer
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`rounded-full px-3 py-1 text-[0.7rem] font-bold ${
                          st.tipo === 'atrasado'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {st.tipo === 'atrasado' ? '⚠ Atrasada' : '⏳ Em aberto'}
                      </span>
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg text-xs font-bold"
                        onClick={() => abrirModalPagar(c)}
                      >
                        <Check className="size-3.5" /> Pagar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal pagamento */}
      <Dialog open={!!payId} onOpenChange={(v) => !v && setPayId(null)}>
        <DialogContent aria-describedby={undefined} className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>✅ Marcar como paga</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Valor pago (R$)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={payValor}
                onChange={(e) => setPayValor(e.target.value)}
                className="mt-1.5 h-12 rounded-xl text-lg font-bold"
              />
              {contaPagar?.valorEstimado ? (
                <p className="mt-1 text-[0.7rem] text-muted-foreground">
                  valor estimado: {fmt(contaPagar.valorEstimado)}
                </p>
              ) : null}
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Data do pagamento
              </Label>
              <Input
                type="date"
                value={payData}
                onChange={(e) => setPayData(e.target.value)}
                className="mt-1.5 h-12 rounded-xl"
              />
            </div>
            <Button onClick={confirmarPagamento} className="h-12 w-full rounded-xl font-bold">
              Confirmar pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
