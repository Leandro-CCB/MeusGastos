'use client';

import * as React from 'react';
import { Download, Plus, Share2, ShieldCheck, Trash2, Upload } from 'lucide-react';
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
import { toast } from 'sonner';
import {
  useMGStore,
  existeDadosLegados,
  getMigracaoInfo,
  getSegurancaLegado,
  baixarSegurancaLegado,
  restaurarSegurancaLegado,
  type MigracaoLegadoInfo,
  type SegurancaLegadoObj,
} from '@/lib/store';
import { EMOJI_OPTIONS, getAllCats, getCatColor } from '@/lib/constants';
import { fmt, monthLabel } from '@/lib/format';
import type { BackupObj } from '@/lib/store';
import { SectionTitle } from './shared';

export function PageConfig() {
  const s = useMGStore();
  const mes = s.currentMonth;

  // ---- plan ----
  const [planOpen, setPlanOpen] = React.useState(false);
  const [planNome, setPlanNome] = React.useState('');
  const [planCat, setPlanCat] = React.useState('');
  const [planLimite, setPlanLimite] = React.useState('');

  // ---- cat ----
  const [catOpen, setCatOpen] = React.useState(false);
  const [catEmoji, setCatEmoji] = React.useState('🏷️');
  const [catNome, setCatNome] = React.useState('');
  const [catCor, setCatCor] = React.useState('#8b5cf6');

  const addPlan = () => {
    if (!planNome.trim()) return toast.error('Informe o nome do planejamento!');
    if (!planCat) return toast.error('Vincule uma categoria!');
    const limite = parseFloat(planLimite) || 0;
    if (limite <= 0) return toast.error('Informe o limite mensal!');
    const catObj = getAllCats(s.config.customCats).find((c) => c.id === planCat);
    s.addPlan({
      nome: planNome.trim(),
      cat: planCat,
      limite,
      emoji: catObj?.emoji || '🏷️',
    });
    toast.success('Planejamento salvo!');
    setPlanNome('');
    setPlanCat('');
    setPlanLimite('');
    setPlanOpen(false);
  };

  const addCat = () => {
    if (!catNome.trim()) return toast.error('Informe o nome da categoria!');
    s.addCustomCat({
      id: 'cat' + Date.now(),
      emoji: catEmoji.trim() || '🏷️',
      nome: catNome.trim(),
      cor: catCor,
    });
    toast.success('Categoria criada!');
    setCatNome('');
    setCatEmoji('🏷️');
    setCatOpen(false);
  };

  // ---- backup ----
  const exportar = () => {
    const data: BackupObj = s.exportarBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-meugasto-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exportado!');
  };

  const importar = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = s.importarBackup(JSON.parse(String(reader.result)));
        if (res.ok) toast.success(res.msg);
        else toast.error(res.msg);
      } catch {
        toast.error('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
    ev.target.value = '';
  };

  const compartilharBackup = async () => {
    const data = JSON.stringify(s.exportarBackup());
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Backup MeuGasto Pro',
          text: data,
        });
      } catch {
        /* usuário cancelou */
      }
    } else {
      await navigator.clipboard.writeText(data);
      toast.success('Backup copiado para a área de transferência!');
    }
  };

  // ---- dados do app original (v1) ----
  const [legadoInfo, setLegadoInfo] = React.useState<MigracaoLegadoInfo | null>(null);
  const [legadoExiste, setLegadoExiste] = React.useState(false);
  const [legadoSnap, setLegadoSnap] = React.useState<SegurancaLegadoObj | null>(null);

  React.useEffect(() => {
    setLegadoInfo(getMigracaoInfo());
    setLegadoExiste(existeDadosLegados());
    setLegadoSnap(getSegurancaLegado());
  }, []);

  const dataLegada = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="mx-auto max-w-3xl">
      {/* ============ PLANEJAMENTOS ============ */}
      <SectionTitle
        action={
          <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg text-xs" onClick={() => setPlanOpen((v) => !v)}>
            <Plus className="size-3.5" /> Adicionar
          </Button>
        }
      >
        Orçamentos mensais
      </SectionTitle>
      <div className="rounded-2xl border bg-card p-4">
        {planOpen && (
          <div className="mb-4 rounded-xl border-2 border-dashed p-3">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Input
                placeholder="Nome do planejamento"
                value={planNome}
                onChange={(e) => setPlanNome(e.target.value)}
                className="h-11 rounded-xl"
              />
              <Select value={planCat} onValueChange={setPlanCat}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Categoria vinculada" />
                </SelectTrigger>
                <SelectContent>
                  {getAllCats(s.config.customCats).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emoji} {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Limite mensal (R$)"
                value={planLimite}
                onChange={(e) => setPlanLimite(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Button onClick={addPlan} size="sm" className="mt-2.5 rounded-xl">
              Adicionar planejamento
            </Button>
          </div>
        )}
        {s.config.plans.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            Nenhum orçamento definido. Crie limites mensais por categoria para acompanhar seus gastos.
          </p>
        ) : (
          <div className="space-y-2">
            {s.config.plans.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <span className="text-lg">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.nome}</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    limite {fmt(p.limite)} · {monthLabel(mes)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    s.deletePlan(p.id);
                    toast('Planejamento removido');
                  }}
                  aria-label={`Remover planejamento ${p.nome}`}
                  className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ CATEGORIAS ============ */}
      <SectionTitle
        action={
          <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg text-xs" onClick={() => setCatOpen((v) => !v)}>
            <Plus className="size-3.5" /> Nova
          </Button>
        }
      >
        Categorias personalizadas
      </SectionTitle>
      <div className="rounded-2xl border bg-card p-4">
        {catOpen && (
          <div className="mb-4 rounded-xl border-2 border-dashed p-3">
            <div className="flex gap-2">
              <Input
                value={catEmoji}
                onChange={(e) => setCatEmoji(e.target.value)}
                maxLength={2}
                className="w-16 shrink-0 text-center text-lg"
                aria-label="Emoji da categoria"
              />
              <Input
                placeholder="Nome da categoria"
                value={catNome}
                onChange={(e) => setCatNome(e.target.value)}
              />
              <input
                type="color"
                value={catCor}
                onChange={(e) => setCatCor(e.target.value)}
                className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border bg-card p-1"
                aria-label="Cor da categoria"
              />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setCatEmoji(e)}
                  aria-label={`Selecionar emoji ${e}`}
                  className={`flex size-9 items-center justify-center rounded-lg border text-base transition-all hover:-translate-y-0.5 ${
                    catEmoji === e ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <Button onClick={addCat} size="sm" className="mt-2.5 rounded-xl">
              Criar categoria
            </Button>
          </div>
        )}
        {s.config.customCats.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            Você usa apenas as 10 categorias padrão. Crie categorias com emoji e cor próprios.
          </p>
        ) : (
          <div className="space-y-2">
            {s.config.customCats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <span
                  className="flex size-9 items-center justify-center rounded-lg text-base"
                  style={{ background: `${getCatColor(c.id, s.config.customCats)}30` }}
                >
                  {c.emoji}
                </span>
                <p className="flex-1 truncate text-sm font-semibold">{c.nome}</p>
                <button
                  onClick={() => {
                    s.deleteCustomCat(c.id);
                    toast('Categoria removida');
                  }}
                  aria-label={`Remover categoria ${c.nome}`}
                  className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ BACKUP ============ */}
      <SectionTitle>Backup e segurança</SectionTitle>
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-sm font-bold">💾 Seus dados, só seus</p>
        <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
          Tudo fica salvo apenas neste dispositivo (localStorage). Exporte backups regularmente —
          o arquivo é <strong>100% compatível com o MeuGasto original</strong>, então você pode importar
          seus dados antigos e voltar quando quiser.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button onClick={exportar} className="flex-1 rounded-xl">
            <Download className="mr-2 size-4" /> Exportar backup (.json)
          </Button>
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="mr-2 size-4" /> Importar backup
          </Button>
          <input
            id="import-file"
            type="file"
            accept="application/json,.json,.txt"
            onChange={importar}
            className="hidden"
          />
        </div>
        <Button variant="whatsapp" className="mt-2.5 w-full rounded-xl" onClick={compartilharBackup}>
          <Share2 className="mr-2 size-4" /> Enviar backup pelo WhatsApp
        </Button>
      </div>

      {/* ============ DADOS DO APP ORIGINAL ============ */}
      <SectionTitle>Dados do app original</SectionTitle>
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <ShieldCheck className="size-4.5 text-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Migração protegida</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              O MeuGasto Pro <strong>lê</strong> os dados do app original sem nunca apagá-los nem
              alterá-los. Antes de qualquer importação, uma cópia de segurança é criada
              automaticamente neste dispositivo.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-muted/60 p-3 text-xs">
          {legadoInfo ? (
            <p>
              ✅ Migrado em <strong>{dataLegada(legadoInfo.migradoEm)}</strong> —{' '}
              {legadoInfo.lancamentos} lançamento(s), {legadoInfo.receitas} receita(s),{' '}
              {legadoInfo.cartoes} cartão(ões), {legadoInfo.investimentos} investimento(s),{' '}
              {legadoInfo.contasFixas} conta(s) fixa(s).
            </p>
          ) : legadoExiste ? (
            <p>
              📦 Dados do app original detectados neste dispositivo. Eles serão importados
              automaticamente assim que o app novo estiver vazio — nada será perdido.
            </p>
          ) : (
            <p>Nenhum dado do app original detectado neste dispositivo.</p>
          )}
          {legadoSnap && (
            <p className="text-muted-foreground">
              🔒 Cópia de segurança do app original criada em{' '}
              <strong>{dataLegada(legadoSnap.salvoEm)}</strong> ({legadoSnap.lancamentos.length}{' '}
              lançamentos preservados).
            </p>
          )}
        </div>

        {legadoSnap && (
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                if (baixarSegurancaLegado()) toast.success('Cópia de segurança baixada!');
              }}
            >
              <Download className="mr-2 size-4" /> Baixar cópia do app original
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex-1 rounded-xl">
                  <Upload className="mr-2 size-4" /> Restaurar dados do original
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurar dados do app original?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Os dados atuais do MeuGasto Pro serão substituídos pela cópia de segurança do
                    app original ({legadoSnap.lancamentos.length} lançamentos salvos em{' '}
                    {dataLegada(legadoSnap.salvoEm)}). Se quiser guardar os dados atuais antes,
                    exporte um backup primeiro.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-xl"
                    onClick={() => {
                      const res = restaurarSegurancaLegado();
                      if (res.ok) toast.success(res.msg);
                      else toast.error(res.msg);
                    }}
                  >
                    Restaurar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* ============ ZONA DE PERIGO ============ */}
      <SectionTitle>Zona de perigo</SectionTitle>
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 size-4" /> Limpar mês atual
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar lançamentos de {monthLabel(mes)}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apaga todos os lançamentos e receitas de {monthLabel(mes)}. Os cartões,
                  investimentos e contas fixas são mantidos. Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    s.limparMes(mes);
                    toast('Lançamentos do mês apagados');
                  }}
                >
                  Apagar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1 rounded-xl">
                <Trash2 className="mr-2 size-4" /> Apagar TODOS os dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar absolutamente tudo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos os lançamentos, receitas, cartões, investimentos, contas fixas e
                  orçamentos serão apagados de forma irreversível. Exporte um backup antes!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    s.limparTudo();
                    toast('Todos os dados foram apagados');
                  }}
                >
                  Sim, apagar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ============ SOBRE ============ */}
      <SectionTitle>Sobre</SectionTitle>
      <div className="rounded-2xl border bg-card p-5 text-xs leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">MeuGasto Pro</strong> — versão modernizada do MeuGasto,
          reconstruída com Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts,
          Zustand e Framer Motion. Tema claro/escuro, 6 paletas de cor, gráficos interativos e
          layout 100% responsivo — do celular ao desktop.
        </p>
      </div>
    </div>
  );
}
