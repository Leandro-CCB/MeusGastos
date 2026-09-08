'use client';

import * as React from 'react';
import {
  Bell,
  BellRing,
  Check,
  Gift,
  Megaphone,
  MessageSquarePlus,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useMGStore } from '@/lib/store';
import type { Notificacao } from '@/lib/types';
import { SectionTitle } from './shared';

const TIPOS: { id: Notificacao['tipo']; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'agradecimento', label: 'Agradecimento', icon: Gift, color: 'text-emerald-500' },
  { id: 'novidade', label: 'Novidade', icon: Sparkles, color: 'text-primary' },
  { id: 'aviso', label: 'Aviso', icon: Megaphone, color: 'text-amber-500' },
];

const dataFmt = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function PageNotificacoes() {
  const notificacoes = useMGStore((s) => s.notificacoes);
  const addNotificacao = useMGStore((s) => s.addNotificacao);
  const updateNotificacao = useMGStore((s) => s.updateNotificacao);
  const deleteNotificacao = useMGStore((s) => s.deleteNotificacao);
  const publicarNotificacao = useMGStore((s) => s.publicarNotificacao);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editandoId, setEditandoId] = React.useState<string | null>(null);

  // form
  const [titulo, setTitulo] = React.useState('');
  const [mensagem, setMensagem] = React.useState('');
  const [tipo, setTipo] = React.useState<Notificacao['tipo']>('agradecimento');

  const resetForm = () => {
    setTitulo('');
    setMensagem('');
    setTipo('agradecimento');
    setEditandoId(null);
    setFormOpen(false);
  };

  const iniciarEdicao = (n: Notificacao) => {
    setTitulo(n.titulo);
    setMensagem(n.mensagem);
    setTipo(n.tipo);
    setEditandoId(n.id);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const salvar = () => {
    if (!titulo.trim()) return toast.error('Informe o título da notificação!');
    if (!mensagem.trim()) return toast.error('Informe a mensagem!');

    if (editandoId) {
      updateNotificacao(editandoId, { titulo: titulo.trim(), mensagem: mensagem.trim(), tipo });
      toast.success('Notificação atualizada!');
    } else {
      addNotificacao({ titulo: titulo.trim(), mensagem: mensagem.trim(), tipo, publicada: false });
      toast.success('Notificação criada! Clique em "Publicar" quando quiser enviar aos clientes.');
    }
    resetForm();
  };

  const publicar = (n: Notificacao) => {
    publicarNotificacao(n.id);
    toast.success(`"${n.titulo}" publicada para todos os clientes!`, { duration: 5000 });
  };

  const despublicar = (n: Notificacao) => {
    updateNotificacao(n.id, { publicada: false });
    toast('Notificação despublicada — clientes não verão mais até você publicar novamente.');
  };

  const publicadas = notificacoes.filter((n) => n.publicada);
  const rascunhos = notificacoes.filter((n) => !n.publicada);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
            Publicadas
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-emerald-500">
            {publicadas.length}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
            Rascunhos
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{rascunhos.length}</p>
        </div>
      </div>

      {/* Como funciona */}
      <div className="mt-4 rounded-2xl border bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Como funciona: </span>
            Crie mensagens de agradecimento, anúncios de novidades ou avisos. Quando clicar em{' '}
            <strong>Publicar</strong>, a notificação aparecerá como popup para todos os clientes
            na próxima vez que abrirem o app. Você pode despublicar a qualquer momento.
          </div>
        </div>
      </div>

      {/* Formulário */}
      <SectionTitle
        action={
          !formOpen ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-lg text-xs"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="size-3.5" /> Nova
            </Button>
          ) : null
        }
      >
        {editandoId ? 'Editando notificação' : 'Nova notificação'}
      </SectionTitle>

      {formOpen && (
        <div className="mb-4 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-4">
          {/* Tipo */}
          <div className="mb-3 flex gap-2">
            {TIPOS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                    tipo === t.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className={`size-3.5 ${tipo === t.id ? 'text-primary' : t.color}`} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            <Input
              placeholder="Título da notificação"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-11 rounded-xl"
            />
            <Textarea
              placeholder="Mensagem para os clientes..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="min-h-[100px] rounded-xl resize-none"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <Button className="h-10 flex-1 rounded-xl" onClick={salvar}>
              <Check className="mr-1.5 size-4" />
              {editandoId ? 'Salvar alterações' : 'Criar rascunho'}
            </Button>
            <Button variant="outline" className="h-10 rounded-xl" onClick={resetForm}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Publicadas */}
      {publicadas.length > 0 && (
        <>
          <SectionTitle>Publicadas ({publicadas.length})</SectionTitle>
          <div className="space-y-2.5">
            {publicadas.map((n) => {
              const tipoInfo = TIPOS.find((t) => t.id === n.tipo) ?? TIPOS[0];
              const TipoIcon = tipoInfo.icon;
              return (
                <div
                  key={n.id}
                  className="rounded-2xl border border-emerald-500/30 bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <TipoIcon className={`size-4 ${tipoInfo.color}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold">{n.titulo}</p>
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-600 dark:text-emerald-400">
                          Publicada
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {n.mensagem}
                      </p>
                      <p className="mt-1.5 text-[0.65rem] text-muted-foreground">
                        {tipoInfo.label} · {dataFmt(n.criadaEm)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 rounded-lg text-xs"
                      onClick={() => iniciarEdicao(n)}
                    >
                      <Pencil className="mr-1 size-3" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 rounded-lg text-xs text-muted-foreground"
                      onClick={() => despublicar(n)}
                    >
                      <BellRing className="mr-1 size-3" /> Despublicar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="mr-1 size-3" /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir notificação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A notificação &quot;{n.titulo}&quot; será removida permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                              deleteNotificacao(n.id);
                              toast('Notificação excluída');
                            }}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Rascunhos */}
      <SectionTitle>Rascunhos ({rascunhos.length})</SectionTitle>
      {rascunhos.length === 0 ? (
        <div className="rounded-2xl border bg-card py-10 text-center">
          <MessageSquarePlus className="mx-auto size-9 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Nenhum rascunho ainda.</p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            Crie uma nova notificação para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rascunhos.map((n) => {
            const tipoInfo = TIPOS.find((t) => t.id === n.tipo) ?? TIPOS[0];
            const TipoIcon = tipoInfo.icon;
            return (
              <div key={n.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <TipoIcon className={`size-4 ${tipoInfo.color}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold">{n.titulo}</p>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.62rem] font-bold text-muted-foreground">
                        Rascunho
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {n.mensagem}
                    </p>
                    <p className="mt-1.5 text-[0.65rem] text-muted-foreground">
                      {tipoInfo.label} · {dataFmt(n.criadaEm)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        className="h-8 flex-1 rounded-lg text-xs"
                      >
                        <Send className="mr-1 size-3" /> Publicar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Publicar notificação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Todos os clientes verão &quot;{n.titulo}&quot; como popup na próxima
                          vez que abrirem o app. Você pode despublicar depois.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded-xl"
                          onClick={() => publicar(n)}
                        >
                          Publicar agora
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 rounded-lg text-xs"
                    onClick={() => iniciarEdicao(n)}
                  >
                    <Pencil className="mr-1 size-3" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 rounded-lg text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="mr-1 size-3" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir rascunho?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O rascunho &quot;{n.titulo}&quot; será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => {
                            deleteNotificacao(n.id);
                            toast('Rascunho excluído');
                          }}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
