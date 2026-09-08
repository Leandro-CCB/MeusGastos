'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { verificarCobrancaPendente, type CobrancaStatus } from '@/lib/licenca';
import { useLicenca } from './license-gate';

// Intervalo de verificação: a cada 30 minutos de sessão ativa
const VERIFICAR_A_CADA_MS = 30 * 60 * 1000;

export function CobrancaBanner() {
  const { codigo, isMaster } = useLicenca();
  const [status, setStatus] = React.useState<CobrancaStatus | null>(null);
  const [visivel, setVisivel] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const verificar = React.useCallback(async () => {
    // Master nunca vê o popup de cobrança
    if (!codigo || isMaster) return;
    try {
      const s = await verificarCobrancaPendente(codigo);
      setStatus(s);
      if (s.pendente) setVisivel(true);
    } catch {
      // Falha silenciosa — não bloqueia o app
    }
  }, [codigo, isMaster]);

  // Verifica ao montar e depois periodicamente
  React.useEffect(() => {
    if (!mounted) return;
    void verificar();
    const interval = setInterval(() => void verificar(), VERIFICAR_A_CADA_MS);
    return () => clearInterval(interval);
  }, [mounted, verificar]);

  const mensagemFinal =
    status?.msg?.trim() ||
    'Seu pagamento está pendente. Por favor, regularize sua situação para continuar usando o MeuGasto Pro. Em caso de não pagamento, sua licença será revogada.';

  return (
    <AnimatePresence>
      {visivel && status?.pendente && (
        <>
          {/* Overlay semi-transparente — não fecha ao clicar, é bloqueante */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal de cobrança */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed left-1/2 top-1/2 z-[61] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2"
          >
            <div className="overflow-hidden rounded-3xl border border-amber-500/40 bg-background shadow-2xl">
              {/* Faixa de alerta no topo */}
              <div className="flex items-center gap-2 bg-amber-500 px-5 py-3">
                <AlertTriangle className="size-5 shrink-0 text-white" />
                <p className="text-sm font-extrabold text-white">Pagamento pendente</p>
              </div>

              <div className="p-5">
                <p className="text-sm leading-relaxed text-foreground">{mensagemFinal}</p>

                <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-3">
                  <p className="text-[0.72rem] leading-relaxed text-muted-foreground">
                    Entre em contato com o responsável pelo app para efetuar o pagamento e regularizar
                    sua licença.
                  </p>
                </div>

                {/* Botão de fechar temporário — o popup volta na próxima vez que abrir o app */}
                <button
                  onClick={() => setVisivel(false)}
                  className="mt-4 w-full rounded-2xl border border-amber-500/40 py-2.5 text-sm font-bold text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400"
                >
                  Entendi — fechar por agora
                </button>

                <p className="mt-2.5 text-center text-[0.62rem] text-muted-foreground">
                  Este aviso continuará aparecendo até o pagamento ser confirmado.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
