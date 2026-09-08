'use client';

import * as React from 'react';
import {
  BadgeCheck,
  Ban,
  BellRing,
  CalendarClock,
  Check,
  Copy,
  Dices,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  Share2,
  Smartphone,
  Trash2,
  Unlock,
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
import { useLicenca } from './license-gate';
import { SectionTitle } from './shared';
import {
  adminCancelarCobranca,
  adminCriarCodigo,
  adminDefinirStatus,
  adminDeletarCodigo,
  adminEditarCodigo,
  adminEnviarCobranca,
  adminListarCodigos,
  adminResetarDispositivo,
  gerarChaveTeste,
  gerarCodigo,
  statusCodigo,
  type CodigoLicenca,
} from '@/lib/licenca';

const dtLocal = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const dataFmt = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function PageCodigos() {
  const { codigo: codigoMaster } = useLicenca();

  const [codigos, setCodigos] = React.useState<CodigoLicenca[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [criando, setCriando] = React.useState(false);
  const [editando, setEditando] = React.useState<string | null>(null);

  // Modal de cobrança in-app
  const [cobrancaCliente, setCobrancaCliente] = React.useState<CodigoLicenca | null>(null);
  const [cobrancaMsg, setCobrancaMsg] = React.useState('');
  const [enviandoCobranca, setEnviandoCobranca] = React.useState(false);

  // form novo código
  const [nome, setNome] = React.useState('');
  const [novoCodigo, setNovoCodigo] = React.useState('');
  const [obs, setObs] = React.useState('');

  // form edição inline
  const [edNome, setEdNome] = React.useState('');
  const [edCodigo, setEdCodigo] = React.useState('');
  const [edObs, setEdObs] = React.useState('');
  const [edExpira, setEdExpira] = React.useState('');

  const carregar = React.useCallback(async () => {
    if (!codigoMaster) return;
    setCarregando(true);
    try {
      const lista = await adminListarCodigos(codigoMaster);
      setCodigos(Array.isArray(lista) ? lista : []);
    } catch (e) {
      toast.error('Erro ao carregar códigos: ' + (e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [codigoMaster]);

  React.useEffect(() => {
    void carregar();
  }, [carregar]);

  const criar = async (chaveTeste = false) => {
    const nomeFinal = (nome).trim() || (chaveTeste ? 'Chave teste' : '');
    if (!chaveTeste && !nomeFinal) {
      toast.error('Informe o nome do cliente!');
      return;
    }
    let codigoFinal = novoCodigo.trim().toUpperCase();
    let expiraEm: string | null = null;
    if (chaveTeste) {
      const t = gerarChaveTeste(nomeFinal);
      codigoFinal = t.codigo;
      expiraEm = t.expiraEm;
    }
    if (!codigoFinal) codigoFinal = gerarCodigo(nomeFinal);

    setCriando(true);
    try {
      await adminCriarCodigo({
        masterCodigo: codigoMaster,
        codigo: codigoFinal,
        nome: nomeFinal,
        observacao: obs.trim() || (chaveTeste ? 'Chave de teste (24h)' : null),
        expiraEm,
      });
      toast.success(
        `Código criado: ${codigoFinal}${expiraEm ? ' (expira em 24h)' : ''}`
      );
      setNome('');
      setNovoCodigo('');
      setObs('');
      await carregar();
    } catch (e) {
      toast.error('Erro: ' + (e as Error).message);
    } finally {
      setCriando(false);
    }
  };

  const iniciarEdicao = (c: CodigoLicenca) => {
    if (editando === c.codigo) {
      setEditando(null);
      return;
    }
    setEditando(c.codigo);
    setEdNome(c.cliente_nome ?? '');
    setEdCodigo(c.codigo);
    setEdObs(c.observacao ?? '');
    setEdExpira(c.expira_em ? dtLocal(c.expira_em) : '');
  };

  const salvarEdicao = async (codigoAtual: string) => {
    if (!edNome.trim()) return toast.error('Informe o nome do cliente!');
    if (!edCodigo.trim()) return toast.error('Informe o código!');
    try {
      await adminEditarCodigo({
        masterCodigo: codigoMaster,
        codigoAtual,
        novoCodigo: edCodigo.trim().toUpperCase(),
        nome: edNome.trim(),
        observacao: edObs.trim() || null,
        expiraEm: edExpira ? new Date(edExpira).toISOString() : null,
      });
      toast.success('Cliente atualizado!');
      setEditando(null);
      await carregar();
    } catch (e) {
      toast.error('Erro: ' + (e as Error).message);
    }
  };

  const alternarStatus = async (c: CodigoLicenca) => {
    try {
      await adminDefinirStatus(codigoMaster, c.codigo, !c.ativo);
      toast.success(!c.ativo ? 'Código reativado' : 'Código revogado');
      await carregar();
    } catch (e) {
      toast.error('Erro: ' + (e as Error).message);
    }
  };

  const liberarAparelho = async (c: CodigoLicenca) => {
    try {
      await adminResetarDispositivo(codigoMaster, c.codigo);
      toast.success('Aparelho liberado — cliente já pode ativar em outro celular/PC');
      await carregar();
    } catch (e) {
      toast.error('Erro: ' + (e as Error).message);
    }
  };

  const excluir = async (c: CodigoLicenca) => {
    try {
      await adminDeletarCodigo(codigoMaster, c.codigo);
      toast.success(`Cliente "${c.cliente_nome || c.codigo}" excluído!`);
      await carregar();
    } catch (e) {
      toast.error('Erro ao excluir: ' + (e as Error).message);
    }
  };

  const abrirCobranca = (c: CodigoLicenca) => {
    setCobrancaCliente(c);
    setCobrancaMsg('');
  };

  const enviarCobranca = async () => {
    if (!cobrancaCliente) return;
    setEnviandoCobranca(true);
    try {
      await adminEnviarCobranca(codigoMaster, cobrancaCliente.codigo, cobrancaMsg.trim() || null);
      toast.success(
        `Cobrança enviada para ${cobrancaCliente.cliente_nome || cobrancaCliente.codigo}! O aviso aparecerá no app do cliente.`,
        { duration: 6000 }
      );
      setCobrancaCliente(null);
      await carregar();
    } catch (e) {
      toast.error('Erro: ' + (e as Error).message);
    } finally {
      setEnviandoCobranca(false);
    }
  };

  const cancelarCobranca = async (c: CodigoLicenca) => {
    try {
      await adminCancelarCobranca(codigoMaster, c.codigo);
      toast.success('Cobrança cancelada — o aviso não aparecerá mais para o cliente.');
      await carregar();
    } catch (e) {
      toast.error('Erro: ' + (e as Error).message);
    }
  };

  const copiar = async (texto: string) => {
    await navigator.clipboard.writeText(texto);
    toast.success('Código copiado!');
  };

  const compartilhar = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MeuGasto Pro', text: 'Controle suas finanças:', url });
      } catch {
        /* cancelado */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* ============ COMPARTILHAR ============ */}
      <SectionTitle
        action={
          <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg text-xs" onClick={compartilhar}>
            <Share2 className="size-3.5" /> Enviar
          </Button>
        }
      >
        Link do app
      </SectionTitle>
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Envie o link do MeuGasto Pro para um novo cliente experimentar. Ele precisará de um
          código de licença para ativar.
        </p>
      </div>

      {/* ============ NOVO CÓDIGO ============ */}
      <SectionTitle>Cadastrar cliente / gerar código</SectionTitle>
      <div className="rounded-2xl border bg-card p-4">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Input
            placeholder="Nome do cliente"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-11 rounded-xl"
            aria-label="Nome do cliente"
          />
          <div className="flex gap-2">
            <Input
              placeholder="Código (vazio = automático)"
              value={novoCodigo}
              onChange={(e) => setNovoCodigo(e.target.value.toUpperCase())}
              className="h-11 flex-1 rounded-xl font-mono uppercase"
              aria-label="Código do cliente"
            />
            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-xl"
              onClick={() => setNovoCodigo(gerarCodigo(nome))}
              aria-label="Gerar código automático"
            >
              <Dices className="size-4" />
            </Button>
          </div>
        </div>
        <Input
          placeholder="Observação (opcional)"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          className="mt-2.5 h-11 rounded-xl"
          aria-label="Observação"
        />
        <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
          <Button disabled={criando} className="h-11 flex-1 rounded-xl" onClick={() => void criar(false)}>
            {criando ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
            Criar código
          </Button>
          <Button
            disabled={criando}
            variant="outline"
            className="h-11 flex-1 rounded-xl"
            onClick={() => void criar(true)}
          >
            <CalendarClock className="mr-2 size-4" /> Chave teste (24h)
          </Button>
        </div>
      </div>

      {/* ============ LISTA ============ */}
      <SectionTitle
        action={
          <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg text-xs" onClick={() => void carregar()}>
            <RefreshCw className="size-3.5" /> Atualizar
          </Button>
        }
      >
        Códigos cadastrados ({codigos.length})
      </SectionTitle>
      <div className="space-y-2.5">
        {carregando ? (
          <div className="flex items-center justify-center rounded-2xl border bg-card py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Carregando...
          </div>
        ) : codigos.length === 0 ? (
          <div className="rounded-2xl border bg-card py-10 text-center text-sm text-muted-foreground">
            Nenhum código cadastrado ainda.
          </div>
        ) : (
          codigos.map((c) => {
            const st = statusCodigo(c);
            const vinculado = !!c.dispositivo_id;
            const emEdicao = editando === c.codigo;
            const temCobranca = c.cobranca_pendente;
            return (
              <div
                key={c.codigo}
                className={`rounded-2xl border bg-card p-4 transition-colors ${
                  emEdicao ? 'border-primary/60' : temCobranca ? 'border-amber-500/50' : ''
                }`}
              >
                {!emEdicao ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="min-w-0 truncate text-sm font-bold">
                          {c.cliente_nome || '(sem nome)'}
                        </p>
                        {temCobranca && (
                          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.62rem] font-bold text-amber-600 dark:text-amber-400">
                            🔔 Cobrança ativa
                          </span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                          st.texto === 'Ativo'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : st.texto === 'Expirado'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-destructive/15 text-destructive'
                        }`}
                      >
                        {st.texto}
                      </span>
                    </div>
                    <button
                      onClick={() => void copiar(c.codigo)}
                      title="Copiar código"
                      className="mt-1 flex w-full items-center gap-1.5 text-left font-mono text-[0.82rem] font-semibold text-primary"
                    >
                      <span className="break-all">{c.codigo}</span>
                      <Copy className="size-3 shrink-0 opacity-60" />
                    </button>
                    <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted-foreground">
                      {vinculado ? '📱 Vinculado a um aparelho' : '⭕ Não ativado ainda'}
                      {c.observacao ? ` · 📝 ${c.observacao}` : ''}
                      {c.expira_em
                        ? ` · ⏳ ${st.expirado ? 'Expirou em ' : 'Expira em '}${dataFmt(c.expira_em)}`
                        : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 rounded-lg text-xs"
                        onClick={() => iniciarEdicao(c)}
                      >
                        <Pencil className="mr-1 size-3" /> Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 flex-1 rounded-lg text-xs ${
                              c.ativo
                                ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                                : 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400'
                            }`}
                          >
                            {c.ativo ? (
                              <>
                                <Ban className="mr-1 size-3" /> Revogar
                              </>
                            ) : (
                              <>
                                <BadgeCheck className="mr-1 size-3" /> Reativar
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {c.ativo ? 'Revogar' : 'Reativar'} o código de{' '}
                              {c.cliente_nome || c.codigo}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {c.ativo
                                ? 'O cliente perderá o acesso ao app na próxima verificação. Você pode reativar depois.'
                                : 'O cliente voltará a ter acesso ao app com este código.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className={`rounded-xl ${
                                c.ativo ? 'bg-destructive text-white hover:bg-destructive/90' : ''
                              }`}
                              onClick={() => void alternarStatus(c)}
                            >
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {vinculado && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs"
                          onClick={() => void liberarAparelho(c)}
                        >
                          <Unlock className="mr-1 size-3" /> Liberar aparelho
                        </Button>
                      )}

                      {/* Botão Cobrança in-app */}
                      {!temCobranca ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                          onClick={() => abrirCobranca(c)}
                        >
                          <BellRing className="mr-1 size-3" /> Cobrar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                          onClick={() => void cancelarCobranca(c)}
                        >
                          <Check className="mr-1 size-3" /> Cancelar cobrança
                        </Button>
                      )}

                      {/* Botão Excluir */}
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
                            <AlertDialogTitle>
                              Excluir {c.cliente_nome || c.codigo}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              O cliente será removido permanentemente do sistema e perderá acesso ao app. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => void excluir(c)}
                            >
                              Excluir cliente
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-2.5 text-xs font-bold text-primary">Editando cliente</p>
                    <div className="grid gap-2">
                      <Input
                        value={edNome}
                        onChange={(e) => setEdNome(e.target.value)}
                        placeholder="Nome do cliente"
                        className="h-10 rounded-xl"
                        aria-label="Nome do cliente"
                      />
                      <Input
                        value={edCodigo}
                        onChange={(e) => setEdCodigo(e.target.value.toUpperCase())}
                        placeholder="Código"
                        className="h-10 rounded-xl font-mono uppercase"
                        aria-label="Código"
                      />
                      <Input
                        value={edObs}
                        onChange={(e) => setEdObs(e.target.value)}
                        placeholder="Observação (opcional)"
                        className="h-10 rounded-xl"
                        aria-label="Observação"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="datetime-local"
                          value={edExpira}
                          onChange={(e) => setEdExpira(e.target.value)}
                          className="h-10 flex-1 rounded-xl"
                          aria-label="Expira em"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-10 shrink-0 rounded-xl"
                          onClick={() => setEdExpira('')}
                          aria-label="Remover validade"
                        >
                          <CalendarClock className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <Button size="sm" className="h-9 flex-1 rounded-xl" onClick={() => void salvarEdicao(c.codigo)}>
                        <Check className="mr-1 size-3.5" /> Salvar
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 flex-1 rounded-xl" onClick={() => setEditando(null)}>
                        Cancelar
                      </Button>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[0.68rem] text-muted-foreground">
                      <Smartphone className="size-3" /> Aparelho: {vinculado ? c.dispositivo_id : '—'}
                    </p>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ============ MODAL DE COBRANÇA IN-APP ============ */}
      {cobrancaCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border bg-background p-5 shadow-2xl">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="size-5 text-amber-500" />
                <h2 className="text-base font-bold">Enviar cobrança in-app</h2>
              </div>
              <button
                onClick={() => setCobrancaCliente(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Um popup de aviso aparecerá no app de{' '}
              <strong>{cobrancaCliente.cliente_nome || cobrancaCliente.codigo}</strong>{' '}
              toda vez que ele abrir o programa, até você cancelar a cobrança.
            </p>

            {/* Preview do popup que o cliente verá */}
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Preview — o que o cliente verá:
              </p>
              <p className="text-xs font-bold">⚠️ Pagamento pendente</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {cobrancaMsg.trim() ||
                  'Seu pagamento está pendente. Por favor, regularize sua situação para continuar usando o MeuGasto Pro. Em caso de não pagamento, sua licença será revogada.'}
              </p>
            </div>

            <Textarea
              placeholder="Mensagem personalizada (opcional — deixe em branco para usar a padrão)"
              value={cobrancaMsg}
              onChange={(e) => setCobrancaMsg(e.target.value)}
              className="mb-3 min-h-[80px] rounded-xl resize-none text-xs"
            />

            <div className="flex gap-2">
              <Button
                className="h-10 flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                disabled={enviandoCobranca}
                onClick={() => void enviarCobranca()}
              >
                {enviandoCobranca ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <BellRing className="mr-1.5 size-4" />
                )}
                Enviar cobrança
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => setCobrancaCliente(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
