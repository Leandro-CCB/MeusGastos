'use client';

import * as React from 'react';
import { Check, CheckCircle2, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useMGStore, getLancamentosDoMes } from '@/lib/store';
import { fmt, fmtPct, monthLabel, monthLabelShort, shiftMonth } from '@/lib/format';
import type { Cartao, Lancamento } from '@/lib/types';
import { BarChartGastos } from './charts';
import { EmptyState, Progress, SectionTitle, TxItem } from './shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/** Verifica se a fatura de um cartão para um mês está "fechada"
 * (data de vencimento já passou dentro do mês atual ou é mês anterior) */
function faturaFechada(cartao: Cartao, mes: string): boolean {
  if (!cartao.venc) return false;
  const hoje = new Date();
  const [ano, m] = mes.split('-').map(Number);
  // Data de vencimento do mês selecionado
  const dataVenc = new Date(ano, m - 1, cartao.venc);
  return hoje >= dataVenc;
}

export function PageCartoes({ onEditTx }: { onEditTx: (t: Lancamento) => void }) {
  const s = useMGStore();
  const currentMonth = s.currentMonth;
  const lanMes = getLancamentosDoMes(s.lancamentos, currentMonth);

  // Estado do form de novo cartão
  const [formOpen, setFormOpen] = React.useState(false);
  const [emoji, setEmoji] = React.useState('💳');
  const [nome, setNome] = React.useState('');
  const [limite, setLimite] = React.useState('');
  const [venc, setVenc] = React.useState('');

  // Estado de edição de cartão
  const [editandoId, setEditandoId] = React.useState<string | null>(null);
  const [edEmoji, setEdEmoji] = React.useState('💳');
  const [edNome, setEdNome] = React.useState('');
  const [edLimite, setEdLimite] = React.useState('');
  const [edVenc, setEdVenc] = React.useState('');

  // Cartões com compras expandidos
  const [expandidos, setExpandidos] = React.useState<Set<string>>(new Set());

  const gastoMesCartoes = lanMes
    .filter((l) => l.isCartao)
    .reduce((a, l) => a + l.valor, 0);

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

  const iniciarEdicao = (c: Cartao) => {
    setEditandoId(c.id);
    setEdEmoji(c.emoji);
    setEdNome(c.nome);
    setEdLimite(c.limite ? String(c.limite) : '');
    setEdVenc(c.venc ? String(c.venc) : '');
  };

  const salvarEdicao = () => {
    if (!edNome.trim()) return toast.error('Informe o nome do cartão!');
    s.updateCartao(editandoId!, {
      emoji: edEmoji.trim() || '💳',
      nome: edNome.trim(),
      limite: parseFloat(edLimite) || 0,
      venc: edVenc ? parseInt(edVenc) : null,
    });
    toast.success('Cartão atualizado!');
    setEditandoId(null);
  };

  const toggleExpandido = (id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pagarFatura = (c: Cartao) => {
    s.pagarFaturaCartao(c.id, currentMonth);
    toast.success(`Fatura de ${monthLabel(currentMonth)} marcada como paga! ✅`);
  };

  const desfazerFatura = (c: Cartao) => {
    s.desfazerFaturaCartao(c.id, currentMonth);
    toast('Pagamento de fatura desfeito.');
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
        <div className="space-y-4">
          {s.cartoes.map((c) => {
            const comprasDoCartao = lanMes.filter((l) => l.isCartao && l.cartaoId === c.id);
            const gasto = comprasDoCartao.reduce((a, l) => a + l.valor, 0);
            const pct = c.limite > 0 ? (gasto / c.limite) * 100 : 0;
            const estaFechada = faturaFechada(c, currentMonth);
            const faturaPaga = c.faturasPagas?.[currentMonth] === true;
            const expandido = expandidos.has(c.id);
            const emEdicao = editandoId === c.id;

            return (
              <div
                key={c.id}
                className={`rounded-2xl border bg-card overflow-hidden transition-all ${
                  faturaPaga ? 'border-emerald-500/40' : estaFechada ? 'border-amber-500/30' : ''
                }`}
              >
                {/* Cabeçalho do cartão */}
                {emEdicao ? (
                  <div className="p-4">
                    <p className="mb-2.5 text-xs font-bold text-primary">Editando cartão</p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className="flex gap-2">
                        <Input
                          value={edEmoji}
                          onChange={(e) => setEdEmoji(e.target.value)}
                          maxLength={2}
                          className="w-16 shrink-0 text-center text-lg"
                          aria-label="Emoji"
                        />
                        <Input
                          value={edNome}
                          onChange={(e) => setEdNome(e.target.value)}
                          placeholder="Nome do cartão"
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={edLimite}
                          onChange={(e) => setEdLimite(e.target.value)}
                          placeholder="Limite (R$)"
                          className="h-10 rounded-xl"
                        />
                        <Input
                          type="number"
                          value={edVenc}
                          onChange={(e) => setEdVenc(e.target.value)}
                          placeholder="Dia venc."
                          min={1}
                          max={31}
                          className="h-10 w-28 shrink-0 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <Button size="sm" className="h-9 flex-1 rounded-xl" onClick={salvarEdicao}>
                        <Check className="mr-1 size-3.5" /> Salvar
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 flex-1 rounded-xl" onClick={() => setEditandoId(null)}>
                        <X className="size-3.5" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="relative overflow-hidden">
                      <div className="chart-gradient pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-10" />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{c.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{c.nome}</p>
                          {c.venc && (
                            <p className="text-[0.65rem] text-muted-foreground">
                              vence dia {c.venc}
                              {estaFechada && !faturaPaga && (
                                <span className="ml-1.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                                  Fatura fechada
                                </span>
                              )}
                              {faturaPaga && (
                                <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <CheckCircle2 className="size-2.5" /> Fatura paga
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        {/* Ações */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => iniciarEdicao(c)}
                            aria-label={`Editar cartão ${c.nome}`}
                            className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                aria-label={`Excluir cartão ${c.nome}`}
                                className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir cartão {c.nome}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O cartão será removido. As compras lançadas nele não serão excluídas, mas perderão o vínculo com o cartão.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() => {
                                    s.deleteCartao(c.id);
                                    toast('Cartão removido');
                                  }}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <p className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--expense)' }}>
                          {fmt(gasto)}
                        </p>
                        {c.limite > 0 && (
                          <span className="text-[0.65rem] text-muted-foreground">
                            de {fmt(c.limite)} · {fmtPct(pct)}
                          </span>
                        )}
                      </div>
                      {c.limite > 0 && (
                        <div className="mt-2">
                          <Progress pct={pct} color="var(--primary)" />
                        </div>
                      )}
                    </div>

                    {/* Botões de ação da fatura */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {estaFechada && !faturaPaga && (
                        <Button
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => pagarFatura(c)}
                        >
                          <Check className="mr-1 size-3" /> Marcar fatura como paga
                        </Button>
                      )}
                      {faturaPaga && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          onClick={() => desfazerFatura(c)}
                        >
                          <CheckCircle2 className="mr-1 size-3" /> Fatura paga · Desfazer
                        </Button>
                      )}
                      {comprasDoCartao.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs"
                          onClick={() => toggleExpandido(c.id)}
                        >
                          {expandido ? (
                            <>
                              <ChevronUp className="mr-1 size-3" /> Ocultar compras ({comprasDoCartao.length})
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-1 size-3" /> Ver compras ({comprasDoCartao.length})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Compras agrupadas (expandível) */}
                {expandido && !emEdicao && comprasDoCartao.length > 0 && (
                  <div className="border-t bg-muted/30 px-4 pb-3 pt-2">
                    <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                      Compras de {monthLabel(currentMonth)}
                    </p>
                    <div className="space-y-1.5">
                      {comprasDoCartao
                        .sort((a, b) => (a.data < b.data ? 1 : -1))
                        .map((l) => (
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
                  </div>
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
    </div>
  );
}
