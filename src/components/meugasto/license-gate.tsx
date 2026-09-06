'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Landmark, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  checarMaster,
  getCodigoSalvo,
  getIsMasterSalvo,
  licencaJaAtiva,
  validarLicenca,
  LICENCA_KEYS,
} from '@/lib/licenca';

// =====================
// CONTEXTO DE LICENÇA
// =====================

interface LicencaContexto {
  verificando: boolean;
  ativada: boolean;
  codigo: string;
  isMaster: boolean;
  ativando: boolean;
  ativar: (codigo: string) => Promise<{ ok: boolean; msg: string }>;
  sair: () => void;
}

const CtxLicenca = React.createContext<LicencaContexto | null>(null);

export function useLicenca(): LicencaContexto {
  const ctx = React.useContext(CtxLicenca);
  if (!ctx) throw new Error('useLicenca fora do LicencaProvider');
  return ctx;
}

export function LicencaProvider({ children }: { children: React.ReactNode }) {
  const [verificando, setVerificando] = React.useState(true);
  const [ativada, setAtivada] = React.useState(false);
  const [codigo, setCodigo] = React.useState('');
  const [isMaster, setIsMaster] = React.useState(false);
  const [ativando, setAtivando] = React.useState(false);

  React.useEffect(() => {
    // primeiro acesso ao localStorage — evita flash do gate durante SSR
    if (licencaJaAtiva()) {
      const cod = getCodigoSalvo();
      setCodigo(cod);
      setIsMaster(getIsMasterSalvo());
      setAtivada(true);
      // revalida master em segundo plano (reflete mudanças no Supabase)
      if (cod) {
        checarMaster(cod)
          .then((m) => {
            setIsMaster(m === true);
            try {
              localStorage.setItem(LICENCA_KEYS.isMaster, m === true ? 'true' : 'false');
            } catch {
              /* ignore */
            }
          })
          .catch(() => {
            /* silencioso */
          });
      }
    }
    setVerificando(false);
  }, []);

  const ativar = React.useCallback(
    async (raw: string): Promise<{ ok: boolean; msg: string }> => {
      const cod = raw.trim().toUpperCase();
      if (!cod) return { ok: false, msg: 'Informe o código de licença.' };
      setAtivando(true);
      try {
        const valido = await validarLicenca(cod);
        if (valido !== true) {
          return {
            ok: false,
            msg: 'Código inválido, já usado em outro aparelho, expirado ou desativado.',
          };
        }
        try {
          localStorage.setItem(LICENCA_KEYS.ok, 'true');
          localStorage.setItem(LICENCA_KEYS.codigo, cod);
        } catch {
          /* ignore */
        }
        let master = false;
        try {
          master = (await checarMaster(cod)) === true;
          localStorage.setItem(LICENCA_KEYS.isMaster, master ? 'true' : 'false');
        } catch {
          /* silencioso */
        }
        setCodigo(cod);
        setIsMaster(master);
        setAtivada(true);
        return { ok: true, msg: master ? 'Licença ativada (admin)!' : 'Licença ativada!' };
      } catch {
        return { ok: false, msg: 'Erro ao verificar a licença. Verifique sua internet.' };
      } finally {
        setAtivando(false);
      }
    },
    []
  );

  const sair = React.useCallback(() => {
    try {
      localStorage.removeItem(LICENCA_KEYS.ok);
      localStorage.removeItem(LICENCA_KEYS.codigo);
      localStorage.removeItem(LICENCA_KEYS.isMaster);
    } catch {
      /* ignore */
    }
    setAtivada(false);
    setCodigo('');
    setIsMaster(false);
  }, []);

  const valor = React.useMemo(
    () => ({ verificando, ativada, codigo, isMaster, ativando, ativar, sair }),
    [verificando, ativada, codigo, isMaster, ativando, ativar, sair]
  );

  return <CtxLicenca.Provider value={valor}>{children}</CtxLicenca.Provider>;
}

// =====================
// GATE DE ATIVAÇÃO
// =====================

export function LicenseGate() {
  const { ativando, ativar } = useLicenca();
  const [valor, setValor] = React.useState('');
  const [erro, setErro] = React.useState('');

  const enviar = async () => {
    setErro('');
    const res = await ativar(valor);
    if (!res.ok) setErro(res.msg);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background px-5 py-8">
      {/* brilhos de fundo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        <div className="rounded-3xl border bg-card/90 p-7 shadow-2xl shadow-primary/10 backdrop-blur-xl">
          {/* marca */}
          <div className="flex flex-col items-center text-center">
            <div className="card-gradient flex size-16 items-center justify-center rounded-2xl shadow-xl shadow-primary/30">
              <Landmark className="size-8 text-white" />
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-tight">
              Meu<span className="text-primary">Gasto</span>
              <span className="ml-1.5 rounded-md bg-primary/12 px-1.5 py-0.5 align-middle text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                Pro
              </span>
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              App licenciado — insira seu código para ativar
            </p>
          </div>

          {/* formulário */}
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
          >
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={valor}
                onChange={(e) => setValor(e.target.value.toUpperCase())}
                placeholder="CÓDIGO-DE-LICENÇA"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus
                aria-label="Código de licença"
                className="h-12 rounded-xl pl-10 font-mono text-sm tracking-wider uppercase"
              />
            </div>

            {erro && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
              >
                {erro}
              </motion.p>
            )}

            <Button type="submit" disabled={ativando} className="h-12 w-full rounded-xl text-sm font-bold">
              {ativando ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Verificando...
                </>
              ) : (
                'Ativar app'
              )}
            </Button>
          </form>

          {/* rodapé */}
          <div className="mt-6 flex items-center justify-center gap-1.5 border-t pt-4 text-[0.7rem] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Licença vinculada a este aparelho · LMA Soluções
          </div>
        </div>

        <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-muted-foreground/70">
          Seus dados financeiros continuam salvos neste aparelho.
          <br />
          A ativação não apaga nada.
        </p>
      </motion.div>
    </div>
  );
}

/** Portão de entrada: mostra o gate enquanto verifica/sem licença; libera o app quando ativada. */
export function RequireLicenca({ children }: { children: React.ReactNode }) {
  const { verificando, ativada } = useLicenca();

  if (verificando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="card-gradient flex size-14 items-center justify-center rounded-2xl shadow-xl shadow-primary/30">
            <Landmark className="size-7 text-white" />
          </div>
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!ativada) return <LicenseGate />;

  return <>{children}</>;
}
