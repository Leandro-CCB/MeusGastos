'use client';

import * as React from 'react';
import { PencilLine, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useMGStore } from '@/lib/store';
import type { Lancamento } from '@/lib/types';
import { CatGrid } from './shared';

export function EditTxModal({
  tx,
  onClose,
}: {
  tx: Lancamento | null;
  onClose: () => void;
}) {
  const updateLancamento = useMGStore((s) => s.updateLancamento);

  const [valor, setValor] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [data, setData] = React.useState('');
  const [cat, setCat] = React.useState('');

  React.useEffect(() => {
    if (tx) {
      setValor(String(tx.valor));
      setDesc(tx.desc || '');
      setData(tx.data);
      setCat(tx.cat);
    }
  }, [tx]);

  const salvar = () => {
    if (!tx) return;
    const v = parseFloat(valor.replace(',', '.'));
    if (!v || v <= 0) return toast.error('Informe um valor válido!');
    if (!cat) return toast.error('Selecione uma categoria!');
    if (!data) return toast.error('Informe a data!');
    updateLancamento(tx.id, { valor: v, desc: desc.trim(), data, cat });
    toast.success('Lançamento atualizado!');
    onClose();
  };

  return (
    <Dialog open={!!tx} onOpenChange={(v) => !v && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="size-4 text-primary" /> Editar lançamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-valor" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Valor (R$)
            </Label>
            <Input
              id="edit-valor"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="mt-1.5 h-12 rounded-xl text-lg font-bold"
            />
          </div>
          <div>
            <Label htmlFor="edit-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Descrição
            </Label>
            <Input
              id="edit-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="edit-data" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Data
            </Label>
            <Input
              id="edit-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Categoria
            </Label>
            <div className="mt-2">
              <CatGrid value={cat} onChange={setCat} />
            </div>
          </div>
          <Button onClick={salvar} className="h-12 w-full rounded-xl font-bold">
            <Save className="mr-2 size-4" /> Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
