'use client';

import * as React from 'react';
import { CreditCard, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useMGStore } from '@/lib/store';
import { todayISO } from '@/lib/format';
import { CatGrid } from './shared';

export function PageLancar() {
  const cartoes = useMGStore((s) => s.cartoes);
  const addLancamentoParcelado = useMGStore((s) => s.addLancamentoParcelado);

  const [valor, setValor] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [data, setData] = React.useState(todayISO());
  const [cat, setCat] = React.useState('');
  const [isCartao, setIsCartao] = React.useState(false);
  const [cartaoId, setCartaoId] = React.useState('');
  const [parcelado, setParcelado] = React.useState(false);
  const [parcelas, setParcelas] = React.useState('2');
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setValor('');
    setDesc('');
    setCat('');
    setParcelado(false);
    setParcelas('2');
    setData(todayISO());
  };

  const salvar = () => {
    const v = parseFloat(valor.replace(',', '.'));
    if (!v || v <= 0) return toast.error('Informe um valor válido!');
    if (!cat) return toast.error('Selecione uma categoria!');
    if (!data) return toast.error('Informe a data!');
    if (isCartao && !cartaoId) return toast.error('Selecione um cartão!');

    setSaving(true);
    try {
      const n = addLancamentoParcelado(
        { valor: v, desc: desc.trim(), cat, data, isCartao, cartaoId: isCartao ? cartaoId : null },
        isCartao && parcelado ? Math.max(2, parseInt(parcelas) || 2) : 1
      );
      toast.success(n > 1 ? `Compra lançada em ${n}x!` : 'Lançamento salvo!');
      reset();
    } finally {
      setSaving(false);
    }
  };

  const valorPreview = parseFloat(valor.replace(',', '.')) || 0;
  const nParcelas = isCartao && parcelado ? Math.max(2, parseInt(parcelas) || 2) : 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border bg-card p-5 sm:p-6">
        {/* Valor */}
        <div className="mb-5">
          <Label htmlFor="f-valor" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Valor (R$)
          </Label>
          <div className="relative mt-1.5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
              R$
            </span>
            <Input
              id="f-valor"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="h-16 rounded-2xl border-2 pl-12 text-2xl font-bold"
            />
          </div>
          {nParcelas > 1 && valorPreview > 0 && (
            <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              {nParcelas}x de R$ {(valorPreview / nParcelas).toFixed(2).replace('.', ',')}
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="mb-4">
          <Label htmlFor="f-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Descrição
          </Label>
          <Input
            id="f-desc"
            placeholder="Ex: Almoço no trabalho"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && salvar()}
            className="mt-1.5 h-12 rounded-xl"
          />
        </div>

        {/* Data */}
        <div className="mb-4">
          <Label htmlFor="f-data" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Data
          </Label>
          <Input
            id="f-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mt-1.5 h-12 rounded-xl"
          />
        </div>

        {/* Categoria */}
        <div className="mb-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Categoria
          </Label>
          <div className="mt-2">
            <CatGrid value={cat} onChange={setCat} />
          </div>
        </div>

        {/* Cartão */}
        <div className="flex items-center justify-between rounded-2xl border-2 p-4 transition-colors data-[on=true]:border-primary/50" data-on={isCartao}>
          <div className="flex items-center gap-3">
            <span className={`flex size-10 items-center justify-center rounded-xl ${isCartao ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Compra no cartão?</p>
              <p className="text-xs text-muted-foreground">Desconto na fatura, sem sair do saldo</p>
            </div>
          </div>
          <Switch checked={isCartao} onCheckedChange={setIsCartao} aria-label="Compra no cartão" />
        </div>

        {isCartao && (
          <div className="mt-4 space-y-4">
            {cartoes.length === 0 ? (
              <p className="rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
                Você ainda não tem cartões. Cadastre um na aba <strong>Cartões</strong>.
              </p>
            ) : (
              <>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cartão
                  </Label>
                  <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                    {cartoes.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCartaoId(c.id)}
                        aria-pressed={cartaoId === c.id}
                        className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                          cartaoId === c.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        <span>{c.emoji}</span> {c.nome}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={!parcelado ? 'default' : 'outline'}
                    onClick={() => setParcelado(false)}
                    className="h-11 rounded-xl"
                  >
                    💵 À vista
                  </Button>
                  <Button
                    variant={parcelado ? 'default' : 'outline'}
                    onClick={() => setParcelado(true)}
                    className="h-11 rounded-xl"
                  >
                    🧾 Parcelado
                  </Button>
                </div>

                {parcelado && (
                  <div>
                    <Label htmlFor="f-parcelas" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Quantidade de parcelas
                    </Label>
                    <Input
                      id="f-parcelas"
                      type="number"
                      min={2}
                      max={48}
                      value={parcelas}
                      onChange={(e) => setParcelas(e.target.value)}
                      className="mt-1.5 h-12 rounded-xl text-lg font-bold"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Button
        size="lg"
        onClick={salvar}
        disabled={saving}
        className="mt-5 h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/25"
      >
        <Save className="mr-2 size-5" /> Salvar lançamento
      </Button>
    </div>
  );
}
