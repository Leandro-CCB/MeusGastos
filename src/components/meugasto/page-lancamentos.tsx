'use client';

import * as React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useMGStore } from '@/lib/store';
import { getAllCats } from '@/lib/constants';
import { fmt } from '@/lib/format';
import type { Lancamento } from '@/lib/types';
import { EmptyState, SectionTitle, TxItem } from './shared';

export function PageLancamentos({ onEditTx }: { onEditTx: (t: Lancamento) => void }) {
  const lancamentos = useMGStore((s) => s.lancamentos);
  const currentMonth = useMGStore((s) => s.currentMonth);
  const deleteLancamento = useMGStore((s) => s.deleteLancamento);
  const customCats = useMGStore((s) => s.config.customCats);

  const [busca, setBusca] = React.useState('');
  const [catsSel, setCatsSel] = React.useState<string[]>([]);

  const cats = getAllCats(customCats);

  const doMes = lancamentos.filter((l) => l.data.startsWith(currentMonth));

  const filtradas = doMes
    .filter((l) => (catsSel.length === 0 ? true : catsSel.includes(l.cat)))
    .filter((l) =>
      busca.trim()
        ? l.desc.toLowerCase().includes(busca.trim().toLowerCase()) ||
          l.valor.toString().includes(busca)
        : true
    )
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  const total = filtradas.reduce((a, l) => a + l.valor, 0);

  const toggleCat = (id: string) =>
    setCatsSel((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  return (
    <div className="mx-auto max-w-3xl">
      {/* Busca + filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição ou valor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-11 rounded-xl" aria-label="Filtrar por categoria">
              <SlidersHorizontal className="mr-2 size-4" />
              <span className="hidden sm:inline">
                {catsSel.length === 0 ? 'Categorias' : `${catsSel.length}`}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto rounded-xl">
            <DropdownMenuLabel>Filtrar por categoria</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {cats.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={catsSel.includes(c.id)}
                onCheckedChange={() => toggleCat(c.id)}
              >
                <span className="mr-1">{c.emoji}</span> {c.nome}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filtradas.length} lançamento{filtradas.length === 1 ? '' : 's'}
          {catsSel.length > 0 && ` · ${catsSel.length} categoria${catsSel.length === 1 ? '' : 's'}`}
        </span>
        <span className="font-bold" style={{ color: 'var(--expense)' }}>
          Total: {fmt(total)}
        </span>
      </div>

      <SectionTitle>Lançamentos do mês</SectionTitle>
      {filtradas.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Nada encontrado"
          hint="Ajuste a busca, o filtro de categorias ou o mês no topo da tela."
        />
      ) : (
        <div className="space-y-2.5">
          {filtradas.map((l) => (
            <TxItem
              key={l.id}
              tx={l}
              onEdit={onEditTx}
              onDelete={(t) => {
                deleteLancamento(t.id);
                toast('Lançamento excluído');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
